// context audio
const audioContext = new AudioContext()

// declaration property
let _sideStereo = 0
let _colorWave = {
  r: 0,
  g: 0,
  b: 0,
  get color () {
    return `rgb(${this.r},${this.g},${this.b})`
  },
  set setColor (value) {
    const colorArray = value.toString().split('')
    this.r = parseInt(colorArray[1].concat(colorArray[2]), 16)
    this.g = parseInt(colorArray[3].concat(colorArray[4]), 16)
    this.b = parseInt(colorArray[5].concat(colorArray[6]), 16)
  },
}
const _fileAudio = 'wave.mp3'
const musics = [{blob: _fileAudio, name: 'Márcio Natalício (Autodidata)'}]
let playing = -1


// element html
const audioEl = document.querySelector('#audio')
const canvas = document.querySelector('#analyser')
const btnPlay = document.querySelector('#play-or-pause')
const vol = document.querySelector('#volume')
const stereo = document.querySelector('#stereo')
const colorEl = document.querySelector('#color')
const fileAudioEl = document.querySelector('#file-audio')
// nodes controllers
const source = audioContext.createMediaElementSource(audioEl)
const analyser = audioContext.createAnalyser()
const gainNode = audioContext.createGain()
const stereoNode = audioContext.createStereoPanner()
const filter = audioContext.createBiquadFilter()
filter.type = 'lowpass'
// config analyser data
analyser.fftSize = 2048 / 4
const lengthBuffer = analyser.frequencyBinCount
let dataArray = new Uint8Array(lengthBuffer)
canvas.width = canvas.getBoundingClientRect().width

// config canvas
const ctx = canvas.getContext('2d')
let barWave = canvas.width / lengthBuffer
_colorWave.setColor = colorEl.value
// function draw wave
let timeStart = Date.now()
function draw() {
  requestAnimationFrame(draw)
  const currentTime = Date.now()

  analyser.getByteTimeDomainData(dataArray)
  if (currentTime - timeStart < 60) return
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const centerWave = ctx.canvas.width / 2
  for (let i = 0, x = 0, wave = 0; i < lengthBuffer; i++, x += barWave) {
    wave = dataArray[i] / 124.0 
    if (_sideStereo === 0) {
    } else if (_sideStereo < 0) {
      if (centerWave >= x) {
        wave = (dataArray[i]) * Math.abs(_sideStereo)
      } else {
        wave = (dataArray[i]) * i / lengthBuffer
      }
    } else if (_sideStereo > 0) {
      if (centerWave <= x) {
        wave = (dataArray[i]) * Math.abs(_sideStereo)
      } else {
        wave = (dataArray[i]) * i / lengthBuffer
      }
    }
    const per_ware = wave
    ctx.fillStyle = `rgb(${per_ware * _colorWave.r}, ${per_ware * _colorWave.g}, ${per_ware * _colorWave.b})`
    ctx.fillRect(x, ctx.canvas.height, barWave, ctx.canvas.height - wave * ctx.canvas.height)
  }

  timeStart = Date.now()
}
// add event listeners

btnPlay.addEventListener('click', function () {
  togglePlay()
})

audioEl.addEventListener('ended', () => {
  btnPlay.dataset.playing = 'false'
  audioContext.suspend()
})
vol.addEventListener('input', (e) => {
  const minValue = 40
  const maxValue = audioContext.sampleRate / 2
  const numberOfOctaves  = Math.log(maxValue / minValue) / Math.LN2
  const multiplier = Math.pow(2, numberOfOctaves * (e.target.value - 1.0))
  gainNode.gain.setValueAtTime(e.target.value, audioContext.currentTime)
  filter.frequency.value = multiplier * maxValue
  console.log(multiplier * maxValue, maxValue)
})

stereo.addEventListener('input', (e) => {
  stereoNode.pan.setValueAtTime(-e.target.value, audioContext.currentTime)
  _sideStereo = e.target.value
})

colorEl.addEventListener('input', function () {
  _colorWave.setColor = this.value
})

fileAudioEl.addEventListener('change', function () {
  const fileMemo = URL.createObjectURL(this.files[0])
  musics.push({blob: fileMemo, name: this.files[0].name})
  updateListMusic()
})


// connect nodes
source
  .connect(gainNode)
  .connect(analyser)
  .connect(filter)
  .connect(stereoNode)
  .connect(audioContext.destination)



requestAnimationFrame(draw)


// functions
function stereoInitial () {
  stereo.value = '0'
  stereo.dispatchEvent(new Event('input'))
}

function updateListMusic () {
  const newMusic = createItem()
  const listEl = document.querySelector('#list-music')
  listEl.appendChild(newMusic)
}

function createItem () {
  const indexMusic = musics.length -1
  const track = musics[indexMusic]
  const item = document.createElement('li')
  item.classList = 'item-music'
  item.innerText = track.name
  item.dataset.track = musics.length -1
  item.addEventListener('click', function () {
    if (playing === parseInt(this.dataset.track)) {
        togglePlay()
      return
    }
    playing = parseInt(this.dataset.track)
    audioEl.pause()
    audioEl.dispatchEvent(new Event('ended'))
    const track = musics[parseInt(this.dataset.track)]
    audioEl.src = track.blob
    btnPlay.dispatchEvent(new Event('click'))
    const items = document.querySelectorAll('[data-track]')
    items.forEach((item, index) => {
      if (parseInt(item.dataset.track) === playing)
        item.style.backgroundColor = _colorWave.color
      else 
        item.style.backgroundColor = 'initial'
    })
  })

  return item
}
function togglePlay () {
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  if (btnPlay.dataset.playing === 'false') {
    btnPlay.dataset.playing = 'true'
    audioEl.play()
  } else {
    btnPlay.dataset.playing = 'false'
    audioContext.suspend()
    audioEl.pause()
  }
}
updateListMusic()