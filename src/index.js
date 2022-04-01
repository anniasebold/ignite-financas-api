const express = require('express')
const { v4: uuidv4 } = require("uuid")

const app = express();
app.use(express.json());

const customers = []

/*
  cpf - string
  name - string
  id - uuid
  statement []

*/

// Middleware

function verifyIfExistsAccountCpf(request, response, next) {
  const { cpf } = request.headers;

  const customerByCpf = customers.find(
    (customer) => customer.cpf === cpf
  );

  if(!customerByCpf) {
    return response.status(400).json({ error: "Customer not found" })
  }

  request.customer = customerByCpf;

  return next();
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;
  
  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists" })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send();
})

app.get("/statement/", verifyIfExistsAccountCpf ,(request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
})

app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  if (!amount) {
    return response.status(400).send({ error: "Amount is required" })
  }

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)

  return response.status(201).json(statementOperation)
})

app.listen(3000, console.log('Server started at http://localhost:3000'));