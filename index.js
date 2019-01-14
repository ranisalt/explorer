(() => {
  const avg = row => row.reduce((acc, val) => acc + val) / row.length
  const zip = rows => rows[0].map((_, col) => rows.map(row => row[col]))

  const createMap = ({ maxBounds, zoom }) => L.map('map', {
    center: zip(maxBounds).map(avg), maxBounds, zoom,
  })

  const addToMap = (map, { marker }) => marker.addTo(map)
  const removeFromMap = (map, { marker }) => marker.removeFrom(map)

  const progress = document.querySelector('.progress')
  const progressValue = document.getElementById('progress-value')
  const history = new Set(JSON.parse(localStorage.getItem('history') || '[]'))

  const updateProgress = current => {
    progress.value = current
    progress.innerText = progressValue.innerText = `${current}/${progress.max} (${(current / progress.max * 100).toFixed()}%)`
  }

  const hasVisited = ({ relation }) => history.has(relation)
  const toggleVisited = (map, { marker, relation }) => {
    if (hasVisited({ relation })) {
      history.delete(relation)
      removeFromMap(map, { marker })
    } else {
      history.add(relation)
      addToMap(map, { marker })
    }
    updateProgress(history.size)

    if (history.size !== 0) {
      localStorage.setItem('history', JSON.stringify([...history.values()]))
    } else {
      localStorage.removeItem('history')
    }
  }

  const createCheckbox = (map, { name, marker, relation }) => {
    const li = document.createElement('li')
    li.classList.add('is-inline-flex', 'list-item')

    const label = document.createElement('label')
    label.classList.add('checkbox')

    const input = document.createElement('input')
    input.checked = hasVisited({ relation })
    input.type = 'checkbox'
    input.addEventListener('change', () => {
      toggleVisited(map, { marker, relation })
      li.parentNode.replaceChild(createCheckbox(map, { name, marker, relation }), li)
    })

    label.appendChild(input)
    label.appendChild(document.createTextNode(' ' + name))
    li.appendChild(label)
    return li
  }

  const createList = (map, { id, name, beaches }) => {
    const root = document.createElement('details')
    root.classList.add('column')

    const title = document.createElement('summary')
    title.appendChild(document.createTextNode(name))
    title.classList.add('subtitle')
    root.append(title)

    const ul = document.createElement('ul')
    for (let beach of beaches) {
      ul.appendChild(createCheckbox(map, beach))
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
    const response = await fetch('floripa.json')
    return response.json()
  }

  const loadMap = async () => {
    const { coordinates, regions, beaches } = await loadMetadata()

    const map = createMap(coordinates)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    tileLayer.addTo(map)

    beaches.forEach(createMarker)
    beaches.filter(hasVisited).forEach(beach => addToMap(map, beach))

    progress.max = beaches.length
    updateProgress(history.size)

    const lists = document.getElementById('lists')
    groupBy(beaches, regions)
      .map(region => createList(map, region))
      .map(list => lists.appendChild(list))

    const modal = document.querySelector('.modal')
    modal.classList.remove('is-active')
  }

  document.addEventListener('DOMContentLoaded', loadMap)
})()
