const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ===============================
// FRONT-END
// ===============================
const FRONTEND_DIR = path.join(__dirname, "../front-end");

app.use(express.static(FRONTEND_DIR));

// ===============================
// BANCO DE DADOS
// ===============================
const DB_FILE = path.join(__dirname, "../backend/db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    console.error("Erro ao ler o banco de dados:", error);

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }
}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ===============================
// PÁGINA INICIAL
// ===============================
app.get("/", (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, "index.html");

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).send(`
    <h1>Projeto Sentinela</h1>
    <p>Servidor funcionando, mas o arquivo front-end/index.html não foi encontrado.</p>
  `);
});

// ===============================
// LOGIN
// ===============================
app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(
    (u) =>
      u.usuario === req.body.usuario &&
      u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// ===============================
// ATENDIMENTO
// ===============================
app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date()
  };

  if (!Array.isArray(db.pacientes)) {
    db.pacientes = [];
  }

  db.pacientes.push(paciente);

  writeDB(db);

  res.json(paciente);
});

// ===============================
// TRIAGEM
// ===============================
app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  const temperatura = Number(req.body.temperatura);

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco: risco,
    status: "aguardando_medico",
    createdAt: new Date()
  };

  if (!Array.isArray(db.triagens)) {
    db.triagens = [];
  }

  db.triagens.push(triagem);

  writeDB(db);

  res.json(triagem);
});

// ===============================
// LISTAR TRIAGENS
// ===============================
app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(db.triagens || []);
});

// ===============================
// LISTA DE MEDICAÇÕES
// ===============================
app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// ===============================
// CONSULTA
// ===============================
app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date()
  };

  if (!Array.isArray(db.consultas)) {
    db.consultas = [];
  }

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);
});

// ===============================
// MEDICAÇÕES / CONSULTAS
// ===============================
app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas || []);
});

// ===============================
// TESTE DA API
// ===============================
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Projeto Sentinela funcionando!",
    timestamp: new Date()
  });
});

// ===============================
// SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
