const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')
let DB = null

const convertingStateDbObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    polulation: dbObject.polulation,
  }
}

const convertDistrictDbObject = (dbObject) => {
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

const reportOfCases = dbObject => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  }
}

const gettingConnectWithDBServer = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3005, () => {
      console.log('Server Running At http://localhost:3005/')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

gettingConnectWithDBServer()

// API : 1

app.get('/states/', async (request, response) => {
  const allStatesApiQuiry = `SELECT 
  * FROM state ;`
  const result = await DB.all(allStatesApiQuiry)
  const stateResult = result.map((each) => convertingStateDbObject(each)
  )
  response.send(stateResult)
})

// API : 2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const idBasedStateQuiry = `
  SELECT * 
  FROM state
  WHERE state_id = ${stateId};`
  const result = await DB.get(idBasedStateQuiry)

  response.send(convertingStateDbObject(result))
})

//API : 3

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const addingDistictQuiry = `INSERT INTO district (district_name, state_id,cases,cured,active,deaths)
  VALUES("${districtName}",
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths});`
  const result = await DB.run(addingDistictQuiry)
  const districtId = result.lastId
  response.send('District Successfully Added')
})

//API : 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const idBasedDistrictQuiry = `SELECT * FROM district WHERE district_id = ${districtId};`
  const result = await DB.get(idBasedDistrictQuiry)
  response.send(convertDistrictDbObject(result))
})

//API : 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuiry = `DELETE FROM district WHERE district_id = ${districtId};`
  await DB.run(deleteQuiry)
  response.send('District Removed')
})

//API : 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuiry = `
  UPDATE district SET
  district_name = "${districtName}" ,
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`

  await DB.run(updateQuiry)
  response.send('District Details Updated')
})

// API : 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const casesInformationQuiry = `
  SELECT SUM(cases) as cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths 
  FROM  district 
  WHERE state_id = ${stateId};`

  const result = await DB.get(casesInformationQuiry)
  const resultReport = reportOfCases(result)
  response.send(resultReport)
})

// API : 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateNameQuiry = `SELECT state_name 
  FROM  state JOIN district ON state.state_id = district.state_id
  WHERE district_id = ${districtId};`

  const result = await DB.get(stateNameQuiry)
  response.send({stateName: result.state_name})
})

module.exports = app
