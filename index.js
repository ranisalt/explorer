(() => {
  const NE = [-27.3804972 + 0.1, -48.3585929 + 0.1]
  const SW = [-27.8390937 - 0.1, -48.5815815 - 0.1]
  const map = L.map('map', {
    center: [(NE[0] + SW[0]) / 2, (NE[1] + SW[1]) / 2],
    maxBounds: [NE, SW],
    zoom: 11
  })

  const addToMap = ({ marker }) => marker.addTo(map)
  const removeFromMap = ({ marker }) => marker.removeFrom(map)

  const progress = document.querySelector('.progress')
  const history = new Set(JSON.parse(localStorage.getItem('history') || '[]'))
  progress.value = history.size

  const hasVisited = ({ relation }) => history.has(relation)
  const toggleVisited = ({ marker, relation }) => {
    if (hasVisited({ relation })) {
      history.delete(relation)
      removeFromMap({ marker })
    } else {
      history.add(relation)
      addToMap({ marker })
    }
    progress.value = history.size

    if (history.size !== 0) {
      localStorage.setItem('history', JSON.stringify([...history.values()]))
    } else {
      localStorage.removeItem('history')
    }
  }

  const createCheckbox = ({ name, marker, relation }) => {
    const li = document.createElement('li')
    li.classList.add('is-inline-flex', 'list-item')

    const label = document.createElement('label')
    label.classList.add('checkbox')

    const input = document.createElement('input')
    input.checked = hasVisited({ relation })
    input.type = 'checkbox'
    input.addEventListener('change', () => {
      toggleVisited({ marker, relation })
      li.parentNode.replaceChild(createCheckbox({ name, marker, relation }), li)
    })

    label.appendChild(input)
    label.appendChild(document.createTextNode(' ' + name))
    li.appendChild(label)
    return li
  }

  const createList = ({ name, beaches }) => {
    const root = document.createElement('div')
    root.classList.add('column')

    const title = document.createElement('p')
    title.appendChild(document.createTextNode(name))
    title.classList.add('subtitle')
    root.append(title)

    const ul = document.createElement('ul')
    for (let beach of beaches) {
      ul.appendChild(createCheckbox(beach))
    }
    root.appendChild(ul)
    root.appendChild(document.createElement('br'))
    return root
  }

  const createMarker = beach => {
    const { name, latlng } = beach
    beach.marker = L.marker(latlng).bindPopup(name)
    return beach
  }

  const groupBy = (beaches, regions) => {
    for (let region of regions) {
      region.beaches = beaches.filter(({ region: id }) => id === region.id)
    }
    return regions.filter(region => region.beaches.length !== 0)
  }

  const loadMetadata = async () => {
    const response = await fetch('metadata.json')
    return response.json()
  }

  const loadMap = async () => {
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    tileLayer.addTo(map)

    const { regions, beaches } = await loadMetadata()
    beaches.forEach(createMarker)
    beaches.filter(hasVisited).forEach(addToMap)

    progress.max = beaches.length

    const lists = document.getElementById('lists')
    groupBy(beaches, regions)
      .map(createList)
      .map(list => lists.appendChild(list))
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadMap()
    // const leaflet = document.createElement('script')
    // leaflet.async = true
    // leaflet.crossorigin = 'anonymous'
    // leaflet.integrity = 'sha256-tfcLorv/GWSrbbsn6NVgflWp1YOmTjyJ8HWtfXaOaJc='
    // leaflet.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/leaflet.js'

    // leaflet.addEventListener('load', loadMap)
    // document.body.appendChild(leaflet)
  })
})()
