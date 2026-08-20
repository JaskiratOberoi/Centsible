// ————— Hansei by Design — motion layer —————

// Ember particles: warm sparks drifting up, like lantern light on a night street.
const canvas = document.getElementById('embers')
const ctx = canvas.getContext('2d')
let W, H, embers
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

function resize() {
  W = canvas.width = innerWidth * devicePixelRatio
  H = canvas.height = innerHeight * devicePixelRatio
  canvas.style.width = innerWidth + 'px'
  canvas.style.height = innerHeight + 'px'
}
resize()
addEventListener('resize', resize)

function spawn(initial) {
  const r = (1 + Math.random() * 2.2) * devicePixelRatio
  return {
    x: Math.random() * W,
    y: initial ? Math.random() * H : H + r * 4,
    r,
    vy: (0.18 + Math.random() * 0.5) * devicePixelRatio,
    vx: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
    wobble: Math.random() * Math.PI * 2,
    hue: 18 + Math.random() * 22, // ember orange → gold
    alpha: 0.25 + Math.random() * 0.5,
  }
}

embers = Array.from({ length: 52 }, () => spawn(true))

function tick() {
  ctx.clearRect(0, 0, W, H)
  for (let i = 0; i < embers.length; i++) {
    const e = embers[i]
    e.wobble += 0.012
    e.x += e.vx + Math.sin(e.wobble) * 0.18 * devicePixelRatio
    e.y -= e.vy
    if (e.y < -10) embers[i] = spawn(false)
    const flicker = 0.75 + Math.sin(e.wobble * 3) * 0.25
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${e.hue}, 90%, 62%, ${e.alpha * flicker})`
    ctx.shadowColor = `hsla(${e.hue}, 95%, 55%, 0.8)`
    ctx.shadowBlur = 10 * devicePixelRatio
    ctx.fill()
  }
  ctx.shadowBlur = 0
  requestAnimationFrame(tick)
}
if (!reduceMotion) requestAnimationFrame(tick)

// Scroll reveals
const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('in')
        io.unobserve(en.target)
      }
    }
  },
  { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
)
document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

// Nav: frosted after scroll
const nav = document.querySelector('.nav')
addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 24)
  // kanji parallax
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const f = parseFloat(el.dataset.parallax)
    const rect = el.parentElement.getBoundingClientRect()
    el.style.transform = `translateY(${rect.top * -f}px)`
  })
}, { passive: true })

// Mobile menu
const burger = document.querySelector('.nav-burger')
const links = document.querySelector('.nav-links')
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open')
  burger.setAttribute('aria-expanded', open)
})
links.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    links.classList.remove('open')
    burger.setAttribute('aria-expanded', 'false')
  })
)
