const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const stateTableconvertDbObjectTOResponseObject = statedbObject => {
  return {
    stateId: statedbObject.state_id,
    stateName: statedbObject.state_name,
    population: statedbObject.population,
  }
}

const districTableconvertDbObjectTOResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//get all state list

app.get('/states/', async (request, response) => {
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state;`
  const dbState = await database.all(getStateQuery)
  response.send(
    dbState.map(eachState =>
      stateTableconvertDbObjectTOResponseObject(eachState),
    ),
  )
})

// get perticular state

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT 
    *
  FROM 
    state
  WHERE 
    state_id= ${stateId};`
  const getstate = await database.get(stateQuery)
  response.send(stateTableconvertDbObjectTOResponseObject(getstate))
})

// add district

app.post('/districts/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const adddistrictQuery = `
  INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)

  VALUES 
    ('${districtName}',
     ${stateId},
     ${cases},
     ${cured},
     ${active},
     ${deaths});`
  await database.run(adddistrictQuery)
  response.send('District Successfully Added')
})

// get perticular district

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictsQuery = `
  SELECT 
    *
  FROM 
    district
  WHERE
    district_id=${districtId};`

  const dbDistrict = await database.get(getDistrictsQuery)
  response.send(districTableconvertDbObjectTOResponseObject(dbDistrict))
})

// delete district

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM
    district
  WHERE 
    district_id=${districtId};`

  await database.run(deleteQuery)
  response.send('District Removed')
})

// update districts details

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuery = `
    UPDATE INTO
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths},
    WHERE 
      district_id=${districtId};`
  await database.run(updateQuery)
  response.send('District Details Updated')
})

// get total number of cases, cured, active, deaths in state

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getTotalStateQuery = `
  SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM 
    state
  WHERE 
    state_id=${stateId};`

  const stats = await database.get(getTotalStateQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

// get district name

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictNameQuery = `
  SELECT 
     state_id
  FROM 
     district
  WHERE 
    district_id=${districtId};`
  const getDbdistrictResponse = await database.get(getdistrictNameQuery)

  const getStateIdQuery = `
  SELECT
    state_name
  FROM 
    state
  WHERE 
    state_id=${getDbdistrictResponse.state_id};`
  const getDbStateResponse = await database.get(getStateIdQuery)
  response.send(getDbStateResponse)
})

module.exports = app
