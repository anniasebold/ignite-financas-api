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

function getBalance(statement) {
  const balance = statement.reduce((acumulator, operation) => {
    if(operation.type === 'credit') {
      return acumulator + operation.amount;
    } else {
      return acumulator - operation.amount;
    }
  }, 0)

  return balance
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

app.put("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).json(customer)
})

app.get("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer);
})

app.delete("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  
  const getIndexCurrentCostumer = customers.findIndex(indexCustumer => indexCustumer.cpf === customer.cpf)

  customers.splice(getIndexCurrentCostumer, 1);

  return response.status(204);
})

app.get("/balance", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({ balance: balance});
})

app.get("/statement", verifyIfExistsAccountCpf ,(request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
})

app.get("/statement/date", verifyIfExistsAccountCpf ,(request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) => 
    statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )

  return response.json(statement);
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

app.post("/withdraw", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  if (!amount) {
    return response.status(400).send({ error: "Amount is required" })
  }

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).send({ error: "Insufficient funds!" })
  }
  
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }
  customer.statement.push(statementOperation)

  return response.status(201).json(statementOperation)
})

app.listen(3000, console.log('Server started at http://localhost:3000'));