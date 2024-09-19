## Staff Backend API v0

- [POST /api/signup] (#post-signup): Signup
- [GET /signup/confirm/:code] : Signup confirmed (email link)
- [PUT /api/login] : login
- [GET /login/confirm/:code] : login confirmed (email link)
- [PUT /api/verify/phone] : verify phone number
- [PUT /api/password-reset] : reset password requested
- [PUT /api/password-reset/confirm/:code] : confirm password request

- [POST /api/election] : add a new election
- [PUT /api/election] : update election details
- [DELETE /api/election] : delete an election
- [POST /api/electoral-system] : set up an electoral system
- [POST /api/electoral-system/entity] : add entity like constituency
- [POST /api/electoral-system/entities] : add large number of entities
- [PUT /api/poll-station] : update a polling station
- [POST /api/political-party] : add a political party
- [POST /api/result] : manually add a result
- [POST /api/result/review] : review an added result
- [POST /api/party-agent] : add a political party agent
- [POST /api/party-agents] : add multiple party agents by csv file
- [PUT /api/party-agent] : update a political party agent


#### POST /api/signup

Input:
- surname
- otherNames
- email
- password

Output:
- msg

Signup is only possible if email is in preapproved list or is organization email


#### PUT /api/login
Input:
- email
- password

Output:
- msg


#### PUT /api/verify/phone
Input:
- code

Output:
- msg


#### PUT /api/password-reset
Input:
- email

Output:
- msg


#### PUT /api/password-reset/confirm/:code
Input:
- email
- code
- password

Output:
- msg


#### POST /api/election
Input:
- entityId
- areaLevel
- date
- type
- includeAllSimilar
- inclusionParentId

Output:
- msg

includeAllSimilar: optional boolean which would set up the election for all 
  similar entities e.g. include all <constituencies> in a <country>
inclusionParentId: entityId of electoral entity (e.g) country that contains the 
  entities being included for elections


#### PUT /api/election
Input:
- candidates: [{name, partyId}]
- specialElection: {name, date}

specialElection: e.g. an election conducted for security and medical staff
  before general election


#### DELETE /api/election
Input:
- electionId
- reason


#### POST /api/electoral-system
Set up hierarchical structure of electoral system
Input:
- areaLevels: e.g ['country', 'region', 'constituency', 'polling station']

areaLevels: array starting from 'country' to the lowest level (polling station)


#### POST /api/electoral-system/entity
Add a country, region, constituency etc.

Input:
- areaLevel
- parentId
- name


#### POST /api/electoral-system/entities
Upload a csv file containing a large number of entities of a given kind
e.g constituencies in a region


#### PUT /api/poll-station
Update a polling station

Input:
- stationId
- name ?
- numRegisteredVoters ?
- location ?
- boundary ? : [{lon: , lat: }, {}]
- parentId ?


#### POST /api/political-party
Input:
- name:
- logo:


#### POST /api/result
Input
- electionId
- stationId
- partyAgentId
- results : [{partyId, numVotes}]
- summary: {totalVotes, rejectedVotes, numRegisteredVoters}
- extras: [{name, value}]

extras: extra fields on Polling Station Results Sheet but not covered in API


#### POST /api/result/review
Input
- electionId
- stationId
- partyAgentId
- approve
- comments


#### POST /api/party-agent
Input:
- partyId
- name
- phone
- pollStations: [{stationId}]


#### POST /api/party-agents
Upload a csv with several party agents


#### PUT /api/party-agent
Update a political party agent
Input:
- agentId
- name ?
- phone ? *
- stationsToAdd: [{stationId}]
- stationsToRemove: [{stationId}]

phone: if updating phone, place record in unconfirmed state to allow the party
  agent to confirm ownership of phone
