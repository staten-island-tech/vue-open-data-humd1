<template>
  <div class="map-wrapper">
    <header class="map-header">
      <p class="subtitle">DOHMH New York City Restaurant Inspection Results</p>
      <h1>Restaurant Grade Map</h1>
      <button class="fetch-btn" :disabled="loading" @click="getRestaurants">
        {{ loading ? 'Loading…' : restaurants.length ? 'Refresh' : 'Load Data' }}
      </button>
    </header>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Fetching inspections…</span>
    </div>

    <div v-if="restaurants.length && !loading" class="content">

      <!-- Grade filter pills -->
      <div class="grade-filters">
        <button
          v-for="g in allGrades"
          :key="g"
          :class="['grade-pill', `grade-${g}`, { inactive: !activeGrades.has(g) }]"
          @click="toggleGrade(g)"
        >
          Grade {{ g }}
          <span class="grade-count">{{ gradeCounts[g] ?? 0 }}</span>
        </button>
      </div>

      <!-- Tooltip -->
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <strong>{{ tooltip.name }}</strong>
        <span class="tip-row">{{ tooltip.cuisine }}</span>
        <span class="tip-row">{{ tooltip.boro }}</span>
        <span :class="['tip-grade', `grade-bg-${tooltip.grade}`]">Grade {{ tooltip.grade }}</span>
        <span class="tip-row" v-if="tooltip.score">Score: {{ tooltip.score }}</span>
      </div>

      <!-- Map -->
      <div class="chart-center">
        <div ref="mapEl" class="map-container" />
      </div>

      <!-- Legend -->
      <div class="legend">
        <div v-for="g in allGrades" :key="g" class="legend-item">
          <span :class="['legend-dot', `grade-${g}`]" />
          <span class="legend-label">Grade {{ g }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot grade-unknown" />
          <span class="legend-label">No grade</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import * as d3 from 'd3'

interface Inspection {
  dba: string
  cuisine_description: string
  boro: string
  grade: string
  score: string
  latitude: string
  longitude: string
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  name: string
  cuisine: string
  boro: string
  grade: string
  score: string
}

const TOKEN = 'BrghHqv1rWgKvU2v4D1hOlMJi'
const restaurants = ref<Inspection[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const mapEl = ref<HTMLDivElement | null>(null)

const allGrades = ['A', 'B', 'C', 'Z', 'P']
const activeGrades = ref(new Set(allGrades))

const tooltip = ref<TooltipState>({
  visible: false, x: 0, y: 0, name: '', cuisine: '', boro: '', grade: '', score: '',
})

const gradeColor: Record<string, string> = {
  A: '#16a34a',
  B: '#d97706',
  C: '#dc2626',
  Z: '#7c3aed',
  P: '#0891b2',
}

const gradeCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const r of restaurants.value) {
    const g = r.grade || 'unknown'
    counts[g] = (counts[g] ?? 0) + 1
  }
  return counts
})

// ── Fetch ─────────────────────────────────────
async function getRestaurants() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch(
      "https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=5000&$where=latitude IS NOT NULL",
      { headers: { 'X-App-Token': TOKEN } }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data: Inspection[] = await response.json()
    restaurants.value = data.filter(r => r.latitude && r.longitude)
    await nextTick()
    renderMap()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

// ── Render Map ─────────────────────────────────
async function renderMap() {
  if (!mapEl.value) return
  const el = mapEl.value
  d3.select(el).selectAll('*').remove()

  const width = Math.min(720, el.clientWidth || 720)
  const height = width * 0.85

  const svg = d3.select(el)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Projection
  const projection = d3.geoMercator()
    .center([-73.98, 40.72])
    .scale(width * 58)
    .translate([width / 2, height / 2])

  const pathGen = d3.geoPath().projection(projection)

  // ✅ REAL borough GeoJSON
  const boroughGeo: any = await d3.json(
    'https://raw.githubusercontent.com/dwillis/nyc-maps/master/boroughs.geojson'
  )

  const mapG = svg.append('g')

  // Boroughs
  mapG.selectAll('path')
    .data(boroughGeo.features)
    .join('path')
    .attr('d', pathGen)
    .attr('fill', '#fef9ee')
    .attr('stroke', '#d97706')
    .attr('stroke-width', 1.2)
    .attr('stroke-opacity', 0.6)

  // Labels
  mapG.selectAll('text')
    .data(boroughGeo.features)
    .join('text')
    .attr('transform', (d: any) => {
      const [x, y] = pathGen.centroid(d)
      return `translate(${x},${y})`
    })
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('fill', '#92400e')
    .text((d: any) => d.properties.borough)

  // Dots
  const visible = restaurants.value.filter(
    r => activeGrades.value.has(r.grade || '__')
  )

  svg.append('g')
    .selectAll('circle')
    .data(visible)
    .join('circle')
    .attr('cx', d => projection([+d.longitude, +d.latitude])?.[0] ?? -999)
    .attr('cy', d => projection([+d.longitude, +d.latitude])?.[1] ?? -999)
    .attr('r', 3.5)
    .attr('fill', d => gradeColor[d.grade] ?? '#94a3b8')
    .attr('fill-opacity', 0.75)
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.4)
    .on('mouseenter', (event: MouseEvent, d) => {
      const rect = el.getBoundingClientRect()
      tooltip.value = {
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 10,
        name: d.dba,
        cuisine: d.cuisine_description,
        boro: d.boro,
        grade: d.grade,
        score: d.score,
      }
      d3.select(event.target as Element).attr('r', 6)
    })
    .on('mouseleave', (event: MouseEvent) => {
      tooltip.value.visible = false
      d3.select(event.target as Element).attr('r', 3.5)
    })
}

function toggleGrade(g: string) {
  const next = new Set(activeGrades.value)
  next.has(g) ? next.delete(g) : next.add(g)
  activeGrades.value = next
}

onMounted(() => getRestaurants())

watch(activeGrades, () => {
  if (restaurants.value.length) renderMap()
}, { deep: true })
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Limelight&family=Federo&display=swap');

.map-wrapper {
  --accent: #d97706;
  --text-primary: #78350f;
  --text-secondary: #92400e;
  --surface: rgba(255, 255, 255, 0.6);
  --border: rgba(217, 119, 6, 0.25);
  --font-display: 'Limelight', cursive;
  --font-body: 'Federo', serif;

  font-family: var(--font-body);
  background: linear-gradient(135deg, #ffffff, #fef3c7);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 2.5rem 2rem;
  box-sizing: border-box;
}

/* ── Header ── */
.map-header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 400;
  margin: 0 0 1rem;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(180, 83, 9, 0.3);
}

.subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.4rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.fetch-btn {
  font-family: var(--font-body);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  background: #fde68a;
  color: #78350f;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1.4rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
}
.fetch-btn:hover:not(:disabled) { background: #fbbf24; }
.fetch-btn:active:not(:disabled) { transform: scale(0.97); }
.fetch-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Content card ── */
.content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 24px rgba(180, 83, 9, 0.08);
  position: relative;
}

/* ── Grade filter pills ── */
.grade-filters {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.grade-pill {
  font-family: var(--font-body);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  border: none;
  border-radius: 20px;
  padding: 0.35rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: opacity 0.2s, transform 0.1s;
  color: #fff;
}
.grade-pill.inactive { opacity: 0.3; }
.grade-pill:active { transform: scale(0.96); }

.grade-A { background: #16a34a; }
.grade-B { background: #d97706; }
.grade-C { background: #dc2626; }
.grade-Z { background: #7c3aed; }
.grade-P { background: #0891b2; }

.grade-count {
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 0.7rem;
}

/* ── Chart centred ── */
.chart-center {
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.map-container { display: inline-block; }

/* ── Tooltip ── */
.tooltip {
  position: absolute;
  background: rgba(255,255,255,0.97);
  border: 1px solid #fbbf24;
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  pointer-events: none;
  transform: translate(-50%, -100%);
  z-index: 10;
  box-shadow: 0 4px 20px rgba(180,83,9,0.15);
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
}
.tooltip strong {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tip-row {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.tip-grade {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  border-radius: 5px;
  padding: 0.1rem 0.5rem;
  align-self: flex-start;
  margin-top: 2px;
}
.grade-bg-A { background: #16a34a; }
.grade-bg-B { background: #d97706; }
.grade-bg-C { background: #dc2626; }
.grade-bg-Z { background: #7c3aed; }
.grade-bg-P { background: #0891b2; }
.grade-bg-  { background: #94a3b8; }

/* ── Legend ── */
.legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: var(--font-body);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.legend-dot.grade-A { background: #16a34a; }
.legend-dot.grade-B { background: #d97706; }
.legend-dot.grade-C { background: #dc2626; }
.legend-dot.grade-Z { background: #7c3aed; }
.legend-dot.grade-P { background: #0891b2; }
.legend-dot.grade-unknown { background: #94a3b8; }

/* ── States ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #fde68a;
  border-top-color: #d97706;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: rgba(254,226,226,0.7);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}
</style>