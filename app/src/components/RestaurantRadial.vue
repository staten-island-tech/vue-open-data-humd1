<template>
  <div class="chart-wrapper">
    <header class="chart-header">
      <p class="subtitle">DOHMH New York City Restaurant Inspection Results</p>
      <h1>Violation Patterns by Borough</h1>
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

      <!-- Borough selector tabs -->
      <div class="borough-tabs">
        <button
          v-for="b in boroughs"
          :key="b"
          :class="['tab', { active: selectedBorough === b }]"
          @click="selectedBorough = b"
        >
          {{ b }}
        </button>
      </div>

      <!-- Tooltip -->
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <strong>{{ tooltip.code }}</strong>
        <span class="tip-desc">{{ violationKey[tooltip.code] ?? 'Unknown violation' }}</span>
        <span class="tip-count">{{ tooltip.count }} violations</span>
      </div>

      <!-- Chart -->
      <div class="chart-center">
        <div ref="chartEl" class="chart-container" />
      </div>

      <!-- Violation key for active codes -->
      <div class="vkey">
        <h2 class="vkey-title">Violation Code Key</h2>
        <div class="vkey-grid">
          <div v-for="code in activeCodes" :key="code" class="vkey-item">
            <span class="vkey-code">{{ code }}</span>
            <span class="vkey-desc">{{ violationKey[code] ?? 'See NYC DOHMH documentation' }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as d3 from 'd3'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Inspection {
  cuisine_description: string
  violation_code: string
  score: string
  grade: string
  dba: string
  boro: string
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  code: string
  count: number
}

// ── Violation key ─────────────────────────────────────────────────────────────

const violationKey: Record<string, string> = {
  '02A': 'Food worker not using proper hand washing technique',
  '02B': 'Hand washing facility not provided / inaccessible',
  '02C': 'Food worker does not wash hands when required',
  '02G': 'Cold or hot water not provided at hand wash facility',
  '02H': 'Open sores / lesions on food worker',
  '03A': 'Food not protected from contamination',
  '03B': 'Shellfish not from approved source',
  '03C': 'Food not from approved source; spoiled',
  '03G': 'Raw or prepared food adulterated / contaminated',
  '04A': 'Food not cooked to required minimum temperature',
  '04B': 'Hot food item not maintained at or above 140°F',
  '04C': 'Cold food item not maintained at or below 41°F',
  '04D': 'Food not cooled by approved methods',
  '04F': 'Food contact surface not properly sanitized',
  '04G': 'Raw food combined with ready-to-eat food',
  '04H': 'Food from unapproved source; additives not approved',
  '04L': 'Milk not from approved source; not pasteurized',
  '04N': 'Meat or poultry served raw; no consumer advisory',
  '05B': 'Plumbing / drainage not maintained',
  '05D': 'Hand wash or toilet facility not properly supplied',
  '05F': 'Inadequate facilities to keep garbage from premises',
  '05H': 'Ventilation system not approved or in good repair',
  '05I': 'Pest control measures not effective',
  '06A': 'Outer clothing not clean / hair not restrained',
  '06C': 'Food not protected — uncovered / improperly stored',
  '06D': 'Food contact surface not properly cleaned and sanitized',
  '06E': 'Wiping cloths not clean / improperly stored',
  '06F': 'Thermometer not provided or not conspicuous',
  '08A': 'Facility not vermin-proof — gaps in walls / ceiling',
  '08C': 'Pesticide application by uncertified person',
  '10B': 'Plumbing not properly installed or maintained',
  '10F': 'Non-food contact surface improperly constructed',
}

// ── State ─────────────────────────────────────────────────────────────────────

const TOKEN = 'BrghHqv1rWgKvU2v4D1hOlMJi'
const restaurants = ref<Inspection[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const chartEl = ref<HTMLDivElement | null>(null)
const activeCodes = ref<string[]>([])
const selectedBorough = ref('MANHATTAN')
const boroughs = ['MANHATTAN', 'BROOKLYN', 'QUEENS', 'BRONX', 'STATEN ISLAND']

const tooltip = ref<TooltipState>({
  visible: false, x: 0, y: 0, code: '', count: 0,
})

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function getRestaurants() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch(
      'https://data.cityofnewyork.us/resource/43nn-pn8j.json?$limit=5000',
      { headers: { 'X-App-Token': TOKEN } }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data: Inspection[] = await response.json()
    restaurants.value = data
    await nextTick()
    renderChart()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderChart() {
  if (!chartEl.value) return
  const el = chartEl.value
  d3.select(el).selectAll('*').remove()

  // Filter to selected borough and count violation codes
  const rows = restaurants.value.filter(
    (r) => r.boro?.toUpperCase() === selectedBorough.value && r.violation_code
  )

  const codeCounts = d3.rollup(rows, (v) => v.length, (r) => r.violation_code)
  const sorted = Array.from(codeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)

  activeCodes.value = sorted.map((d) => d[0])

  const data = sorted.map(([code, count]) => ({ code, count }))

  // Dimensions
  const size = Math.min(560, window.innerWidth - 80)
  const cx = size / 2
  const cy = size / 2
  const innerR = size * 0.18
  const outerR = size * 0.46
  const maxCount = d3.max(data, (d) => d.count) ?? 1

  const svg = d3.select(el)
    .append('svg')
    .attr('width', size)
    .attr('height', size)

  // Angle scale — one slice per violation code
  const angleScale = d3.scaleBand()
    .domain(data.map((d) => d.code))
    .range([0, 2 * Math.PI])
    .padding(0.04)

  // Radius scale
  const rScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([innerR, outerR])

  // Amber colour scale
  const colorScale = d3.scaleSequential(d3.interpolate('#fde68a', '#92400e'))
    .domain([0, maxCount])

  const arcGen = d3.arc<{ code: string; count: number }>()
    .innerRadius(innerR)
    .outerRadius((d) => rScale(d.count))
    .startAngle((d) => angleScale(d.code)!)
    .endAngle((d) => angleScale(d.code)! + angleScale.bandwidth())
    .padAngle(0.02)
    .cornerRadius(3)

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

  // Concentric guide rings
  const ringCounts = [0.25, 0.5, 0.75, 1.0]
  ringCounts.forEach((frac) => {
    g.append('circle')
      .attr('r', innerR + (outerR - innerR) * frac)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(217,119,6,0.12)')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '3 3')
  })

  // Arc slices
  g.selectAll('path.arc')
    .data(data)
    .join('path')
    .attr('class', 'arc')
    .attr('fill', (d) => colorScale(d.count))
    .attr('opacity', 0)
    .attr('d', arcGen)
    .on('mouseenter', (event: MouseEvent, d) => {
      const svgRect = (el.querySelector('svg') as SVGElement).getBoundingClientRect()
      const wrapRect = el.getBoundingClientRect()
      const mx = (event as MouseEvent).clientX - wrapRect.left
      const my = (event as MouseEvent).clientY - wrapRect.top
      tooltip.value = { visible: true, x: mx, y: my - 10, code: d.code, count: d.count }
      d3.select(event.target as Element)
        .attr('stroke', '#d97706')
        .attr('stroke-width', 2)
        .attr('opacity', 1)
    })
    .on('mousemove', (event: MouseEvent) => {
      const wrapRect = el.getBoundingClientRect()
      tooltip.value.x = event.clientX - wrapRect.left
      tooltip.value.y = event.clientY - wrapRect.top - 10
    })
    .on('mouseleave', (event: MouseEvent, d) => {
      tooltip.value.visible = false
      d3.select(event.target as Element)
        .attr('stroke', null)
        .attr('opacity', colorScale(d.count) ? 0.9 : 0.9)
    })
    .transition()
    .duration(600)
    .delay((_, i) => i * 40)
    .attr('opacity', 0.9)

  // Code labels on each slice
  data.forEach((d) => {
    const midAngle = angleScale(d.code)! + angleScale.bandwidth() / 2
    const labelR = outerR + 18
    const lx = Math.sin(midAngle) * labelR
    const ly = -Math.cos(midAngle) * labelR
    const rotation = (midAngle * 180) / Math.PI
    const flip = midAngle > Math.PI

    g.append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('transform', `rotate(${flip ? rotation + 180 : rotation}, ${lx}, ${ly})`)
      .attr('font-size', '10px')
      .attr('font-family', 'Federo, serif')
      .attr('fill', '#78350f')
      .text(d.code)
  })

  // Centre label
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -10)
    .attr('font-family', 'Limelight, cursive')
    .attr('font-size', '13px')
    .attr('fill', '#d97706')
    .text(selectedBorough.value)

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 10)
    .attr('font-family', 'Federo, serif')
    .attr('font-size', '10px')
    .attr('fill', '#92400e')
    .text(`${rows.length} inspections`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => getRestaurants())

watch(selectedBorough, () => {
  if (restaurants.value.length) renderChart()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Limelight&family=Federo&display=swap');

.chart-wrapper {
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
.chart-header {
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

/* ── Borough tabs ── */
.borough-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab {
  font-family: var(--font-body);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  background: rgba(255,255,255,0.7);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0.35rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab:hover { background: #fde68a; color: #78350f; }
.tab.active {
  background: #fbbf24;
  color: #78350f;
  border-color: #d97706;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);
}

/* ── Chart centred ── */
.chart-center {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.chart-container {
  display: inline-block;
}

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
  box-shadow: 0 4px 20px rgba(180, 83, 9, 0.15);
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 240px;
}
.tooltip strong {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--accent);
}
.tip-desc {
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.tip-count {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 600;
}

/* ── Violation key ── */
.vkey {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
}
.vkey-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 400;
  color: #fbbf24;
  text-shadow: 0 1px 6px rgba(180, 83, 9, 0.2);
  text-align: center;
  margin: 0 0 1rem;
}
.vkey-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.5rem 1.5rem;
}
.vkey-item {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 0.78rem;
  line-height: 1.5;
}
.vkey-code {
  flex-shrink: 0;
  font-family: var(--font-display);
  font-size: 0.68rem;
  background: #fde68a;
  color: #78350f;
  border-radius: 5px;
  padding: 0.15rem 0.45rem;
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.vkey-desc { color: var(--text-secondary); font-family: var(--font-body); }

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