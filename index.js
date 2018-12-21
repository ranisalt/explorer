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
  const progressValue = document.getElementById('progress-value')
  const history = new Set(JSON.parse(localStorage.getItem('history') || '[]'))

  const updateProgress = current => {
    progress.value = current
    progress.innerText = progressValue.innerText = `${current}/${progress.max} (${(current / progress.max * 100).toFixed()}%)`
  }

  const hasVisited = ({ relation }) => history.has(relation)
  const toggleVisited = ({ marker, relation }) => {
    if (hasVisited({ relation })) {
      history.delete(relation)
      removeFromMap({ marker })
    } else {
      history.add(relation)
      addToMap({ marker })
    }
    updateProgress(history.size)

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

  const createList = ({ id, name, beaches }) => {
    const root = document.createElement('details')
    root.classList.add('column')

    const title = document.createElement('summary')
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
    updateProgress(history.size)

    const lists = document.getElementById('lists')
    groupBy(beaches, regions)
      .map(createList)
      .map(list => lists.appendChild(list))

    const modal = document.querySelector('.modal')
    modal.classList.remove('is-active')
  }

  document.addEventListener('DOMContentLoaded', loadMap)
})()
