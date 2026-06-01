
/* app.jp */

const screens = document.querySelectorAll(".screen");

const goToLoginButton = document.getElementById("go-to-login");
const goToRegisterButton = document.getElementById("go-to-register");

const loginToRegisterButton = document.getElementById("login-to-register");
const registerToLoginButton = document.getElementById("register-to-login");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");

const optionButtons = document.querySelectorAll(".option-button");
const finishOnboardingButton = document.getElementById("finish-onboarding");

const dashboardUserName = document.getElementById("dashboard-user-name");
const logoutButton = document.getElementById("logout-button");
const refreshRatesButton = document.getElementById("refresh-rates");
const themeToggleButton = document.getElementById("theme-toggle-button");
const exchangeRatesContainer = document.getElementById("exchange-rates");

const previousRateButton = document.getElementById("previous-rate");
const nextRateButton = document.getElementById("next-rate");
const rateIndicators = document.getElementById("rate-indicators");

const balanceValue = document.getElementById("balance-value");
const accountNumber = document.getElementById("account-number");
const balanceCard = document.querySelector(".balance-card");
const transactionList = document.getElementById("transaction-list");

const actionButtons = document.querySelectorAll(".action-button");
const operationForm = document.getElementById("operation-form");
const operationTitle = document.getElementById("operation-title");
const operationSubmit = document.getElementById("operation-submit");
const operationAmount = document.getElementById("operation-amount");
const operationMessage = document.getElementById("operation-message");

const transferEmailGroup = document.getElementById("transfer-email-group");
const transferEmailInput = document.getElementById("transfer-email");

const USERS_STORAGE_KEY = "flowbank_users";
const SESSION_STORAGE_KEY = "flowbank_session";
const THEME_STORAGE_KEY = "flowbank_theme";

let selectedGoal = "Organizar gastos";
let currentOperation = null;

let exchangeRates = [];
let currentRateIndex = 0;
let rateCarouselInterval = null;

/* operações e movimetações */

const operationConfig = {
  deposit: {
    title: "Depositar",
    submitText: "Confirmar depósito"
  },
  withdraw: {
    title: "Sacar",
    submitText: "Confirmar saque"
  },
  transfer: {
    title: "Transferir",
    submitText: "Confirmar transferência"
  }
};

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  const targetScreen = document.getElementById(screenId);

  if (targetScreen) {
    targetScreen.classList.add("active");
  }
}

function clearMessages() {
  loginMessage.textContent = "";
  registerMessage.textContent = "";

  if (operationMessage) {
    operationMessage.textContent = "";
  }
}

function getUsers() {
  const usersData = localStorage.getItem(USERS_STORAGE_KEY);

  if (!usersData) {
    return [];
  }

  return JSON.parse(usersData);
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  const users = getUsers();

  return users.find((user) => user.email === email);
}

function updateUser(updatedUser) {
  const users = getUsers();

  const updatedUsers = users.map((user) => {
    if (user.email === updatedUser.email) {
      return updatedUser;
    }

    return user;
  });

  saveUsers(updatedUsers);
}

/* manutenaçõ da sessão com LocalStorage */

function saveSession(email) {
  localStorage.setItem(SESSION_STORAGE_KEY, email);
}

function getSession() {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function getCurrentUser() {
  const sessionEmail = getSession();

  if (!sessionEmail) {
    return null;
  }

  return findUserByEmail(sessionEmail);
}

/* funções auxiliares */

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/* gera numero unico de conta a partir do e-mail*/
function generateAccountNumber(email) {
  let hash = 0;

  const normalizedEmail = email.trim().toLowerCase();

  for (let i = 0; i < normalizedEmail.length; i++) {
    hash = (hash * 31 + normalizedEmail.charCodeAt(i)) >>> 0;
  }

  const accountBase = String(hash).padStart(10, "0").slice(-10);

  const agency = accountBase.slice(0, 4);
  const account = accountBase.slice(4, 9);
  const digit = accountBase.slice(9);

  return `${agency}.${account}-${digit}`;
}

function formatRateValue(value, currencyCode) {
  const numberValue = Number(value);

  const currenciesWithFourDecimals = ["ARS", "JPY"];

  if (currenciesWithFourDecimals.includes(currencyCode)) {
    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  }

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getRateVariationClass(pctChange) {
  const variation = Number(pctChange);

  if (variation > 0) {
    return "income";
  }

  if (variation < 0) {
    return "expense";
  }

  return "muted-text";
}

function renderExchangeRates(rates) {
  exchangeRates = rates;
  currentRateIndex = 0;

  renderCurrentRate();
  startRateCarousel();
}

/* geração dos modelos de cards */

function renderCurrentRate() {
  if (!exchangeRates.length) {
    return;
  }

  const rate = exchangeRates[currentRateIndex];
  const variationClass = getRateVariationClass(rate.pctChange);
  const formattedBid = formatRateValue(rate.bid, rate.code);

  exchangeRatesContainer.innerHTML = `
    <article class="rate-card" aria-live="polite">
      <span>${rate.code}</span>
      <strong>${formattedBid}</strong>
      <small>${rate.name}</small>
      <small class="${variationClass}">
        ${rate.pctChange}% hoje
      </small>
    </article>
  `;

  renderRateIndicators();
}

function renderRateIndicators() {
  rateIndicators.innerHTML = exchangeRates.map((_, index) => {
    const activeClass = index === currentRateIndex ? "active" : "";

    return `<span class="carousel-dot ${activeClass}"></span>`;
  }).join("");
}

function showNextRate() {
  if (!exchangeRates.length) {
    return;
  }

  currentRateIndex = (currentRateIndex + 1) % exchangeRates.length;
  renderCurrentRate();
}

function showPreviousRate() {
  if (!exchangeRates.length) {
    return;
  }

  currentRateIndex =
    (currentRateIndex - 1 + exchangeRates.length) % exchangeRates.length;

  renderCurrentRate();
}

/* geração da estrututra carrosel e cards */

function startRateCarousel() {
  stopRateCarousel();

  rateCarouselInterval = setInterval(() => {
    showNextRate();
  }, 10000);
}

function stopRateCarousel() {
  if (rateCarouselInterval) {
    clearInterval(rateCarouselInterval);
    rateCarouselInterval = null;
  }
}

function renderRatesLoading() {
  stopRateCarousel();

  exchangeRatesContainer.innerHTML = `
    <article class="rate-card">
      <span>...</span>
      <strong>Carregando</strong>
      <small>Buscando cotações atualizadas</small>
    </article>
  `;

  rateIndicators.innerHTML = "";
}

/* erro para exibição */

function renderRatesError() {
  stopRateCarousel();

  exchangeRatesContainer.innerHTML = `
    <article class="rate-card">
      <span>API</span>
      <strong>Indisponível</strong>
      <small>Não foi possível carregar as cotações agora.</small>
    </article>
  `;

  rateIndicators.innerHTML = "";
}

/* chamadas para a AwesomeAPI e funções de formatação */

async function loadExchangeRates() {
  renderRatesLoading();

  try {
		const response = await fetch(
		  "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL,ARS-BRL,JPY-BRL,CAD-BRL,CNY-BRL,BTC-BRL"
		);

    if (!response.ok) {
      throw new Error("Erro ao consultar API de moedas.");
    }

    const data = await response.json();

	const rates = [
	  data.USDBRL,
	  data.EURBRL,
	  data.GBPBRL,
	  data.ARSBRL,
	  data.JPYBRL,
	  data.CADBRL,
	  data.CNYBRL,
	  data.BTCBRL
	].filter(Boolean);

    renderExchangeRates(rates);
  } catch (error) {
    console.error(error);
    renderRatesError();
  }
}

function formatTransactionDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function createTransaction(description, amount, type) {
  return {
    description,
    amount,
    type,
    date: getTodayDate()
  };
}

function createDefaultTransactions() {
  return [];
}

function createDefaultUser(name, email, password) {
  return {
    name,
    email,
    password,
    onboarded: false,
    goal: null,
    balance: 0,
    transactions: createDefaultTransactions()
  };
}

/* principal dashboard */

function updateDashboard(user) {
  dashboardUserName.textContent = `Olá, ${user.name}`;
  balanceValue.textContent = formatCurrency(user.balance);
  accountNumber.textContent = `Conta FlowBank • ${generateAccountNumber(user.email)}`;

  if (user.balance < 0) {
    balanceCard.classList.add("negative");
  } else {
    balanceCard.classList.remove("negative");
  }

  transactionList.innerHTML = "";

  if (!user.transactions || user.transactions.length === 0) {
    transactionList.innerHTML = `
      <li class="transaction-item">
        <div>
          <strong>Nenhum lançamento encontrado</strong>
          <small>Suas movimentações aparecerão aqui.</small>
        </div>
      </li>
    `;

    return;
  }

  user.transactions.forEach((transaction) => {
    const isIncome = transaction.amount > 0;
    const amountClass = isIncome ? "income" : "expense";
    const amountPrefix = isIncome ? "+" : "-";
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));

    const transactionItem = document.createElement("li");
    transactionItem.classList.add("transaction-item");

    transactionItem.innerHTML = `
      <div>
        <strong>${transaction.description}</strong>
        <small>${formatTransactionDate(transaction.date)}</small>
      </div>

      <span class="${amountClass}">
        ${amountPrefix} ${formattedAmount}
      </span>
    `;

    transactionList.appendChild(transactionItem);
  });
}

/* gerenciamento de login */

function handleAuthenticatedUser(user) {
  updateDashboard(user);

  if (user.onboarded) {
    showScreen("dashboard-screen");
    loadExchangeRates();
  } else {
    showScreen("onboarding-screen");
  }
}

function loginUser(email, password) {
  const user = findUserByEmail(email);

  if (!user) {
    loginMessage.textContent = "Nenhuma conta encontrada com este e-mail.";
    return;
  }

  if (user.password !== password) {
    loginMessage.textContent = "Senha inválida.";
    return;
  }

  saveSession(user.email);
  handleAuthenticatedUser(user);
}

function registerUser(name, email, password) {
  const users = getUsers();
  const existingUser = findUserByEmail(email);

  if (existingUser) {
    registerMessage.textContent = "Já existe uma conta com este e-mail.";
    return;
  }

  const newUser = createDefaultUser(name, email, password);

  users.push(newUser);
  saveUsers(users);
  saveSession(newUser.email);

  handleAuthenticatedUser(newUser);
}

function finishOnboarding() {
  const user = getCurrentUser();

  if (!user) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  user.onboarded = true;
  user.goal = selectedGoal;

  updateUser(user);
  updateDashboard(user);
  showScreen("dashboard-screen");
}

function logoutUser() {
  clearSession();
  clearMessages();

  loginForm.reset();
  registerForm.reset();

  showScreen("welcome-screen");
}

function restoreSession() {
  const user = getCurrentUser();

  if (!user) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  handleAuthenticatedUser(user);
}

/* operações internas da dashboard*/

function openOperationScreen(operation) {
  currentOperation = operation;

  const config = operationConfig[operation];

  operationTitle.textContent = config.title;
  operationSubmit.textContent = config.submitText;

  operationForm.reset();
  operationMessage.textContent = "";

  if (operation === "transfer") {
    transferEmailGroup.classList.add("visible");
    transferEmailInput.setAttribute("required", "required");
  } else {
    transferEmailGroup.classList.remove("visible");
    transferEmailInput.removeAttribute("required");
  }

  showScreen("operation-screen");
}

function getOperationAmount() {
  const amount = Number(operationAmount.value);

  if (!amount || amount <= 0) {
    operationMessage.textContent = "Informe um valor maior que zero.";
    return null;
  }

  return amount;
}

function handleDeposit() {
  const amount = getOperationAmount();

  if (!amount) {
    return;
  }

  const user = getCurrentUser();

  if (!user) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  user.balance += amount;

  user.transactions.unshift(
    createTransaction("Depósito", amount, "income")
  );

  updateUser(user);
  updateDashboard(user);

  operationForm.reset();
  showScreen("dashboard-screen");
}

function handleWithdraw() {
  const amount = getOperationAmount();

  if (!amount) {
    return;
  }

  const user = getCurrentUser();

  if (!user) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  user.balance -= amount;

  user.transactions.unshift(
    createTransaction("Saque", -amount, "expense")
  );

  updateUser(user);
  updateDashboard(user);

  operationForm.reset();
  showScreen("dashboard-screen");
}

function handleTransfer() {
  const amount = getOperationAmount();

  if (!amount) {
    return;
  }

  const sender = getCurrentUser();

  if (!sender) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  const receiverEmail = transferEmailInput.value.trim();

  if (!receiverEmail) {
    operationMessage.textContent = "Informe o e-mail da conta de destino.";
    return;
  }

  if (receiverEmail === sender.email) {
    operationMessage.textContent = "Não é possível transferir para a própria conta.";
    return;
  }

  const users = getUsers();
  const receiver = users.find((user) => user.email === receiverEmail);

  if (!receiver) {
    operationMessage.textContent = "Conta de destino não encontrada.";
    return;
  }

  const updatedUsers = users.map((user) => {
    if (user.email === sender.email) {
      return {
        ...user,
        balance: user.balance - amount,
        transactions: [
          createTransaction(`Transferência enviada para ${receiver.email}`, -amount, "expense"),
          ...user.transactions
        ]
      };
    }

    if (user.email === receiver.email) {
      return {
        ...user,
        balance: user.balance + amount,
        transactions: [
          createTransaction(`Transferência recebida de ${sender.email}`, amount, "income"),
          ...user.transactions
        ]
      };
    }

    return user;
  });

  saveUsers(updatedUsers);

  const updatedSender = updatedUsers.find((user) => user.email === sender.email);

  updateDashboard(updatedSender);

  operationForm.reset();
  showScreen("dashboard-screen");
}

function handleOperationSubmit(event) {
  event.preventDefault();

  if (currentOperation === "deposit") {
    handleDeposit();
    return;
  }

  if (currentOperation === "withdraw") {
    handleWithdraw();
    return;
  }

  if (currentOperation === "transfer") {
    handleTransfer();
  }
}

/* dark mode */

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    themeToggleButton.textContent = "☀️";
    themeToggleButton.setAttribute("aria-pressed", "true");
    themeToggleButton.setAttribute("title", "Alternar para modo claro");
    themeToggleButton.setAttribute("aria-label", "Alternar para modo claro");
    return;
  }

  document.body.classList.remove("dark-theme");
  themeToggleButton.textContent = "🌙";
  themeToggleButton.setAttribute("aria-pressed", "false");
  themeToggleButton.setAttribute("title", "Alternar para modo noturno");
  themeToggleButton.setAttribute("aria-label", "Alternar para modo noturno");
}

function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "light";
}

function toggleTheme() {
  const isDarkTheme = document.body.classList.contains("dark-theme");
  const newTheme = isDarkTheme ? "light" : "dark";

  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  applyTheme(newTheme);
}

/* eventos */

goToLoginButton.addEventListener("click", () => {
  clearMessages();
  showScreen("login-screen");
});

goToRegisterButton.addEventListener("click", () => {
  clearMessages();
  showScreen("register-screen");
});

loginToRegisterButton.addEventListener("click", () => {
  clearMessages();
  showScreen("register-screen");
});

registerToLoginButton.addEventListener("click", () => {
  clearMessages();
  showScreen("login-screen");
});

document.querySelectorAll(".back-button").forEach((button) => {
  button.addEventListener("click", () => {
    const targetScreen = button.dataset.target;
    clearMessages();
    showScreen(targetScreen);
  });
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    loginMessage.textContent = "Preencha e-mail e senha para continuar.";
    return;
  }

  loginUser(email, password);
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const confirmPassword = document
    .getElementById("register-confirm-password")
    .value
    .trim();

  if (!name || !email || !password || !confirmPassword) {
    registerMessage.textContent = "Preencha todos os campos.";
    return;
  }

  if (password.length < 4) {
    registerMessage.textContent = "A senha precisa ter pelo menos 4 caracteres.";
    return;
  }

  if (password !== confirmPassword) {
    registerMessage.textContent = "As senhas não conferem.";
    return;
  }

  registerUser(name, email, password);
});

optionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    optionButtons.forEach((item) => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedGoal = button.dataset.goal;
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openOperationScreen(button.dataset.operation);
  });
});

finishOnboardingButton.addEventListener("click", () => {
  finishOnboarding();
});

logoutButton.addEventListener("click", () => {
  logoutUser();
});

operationForm.addEventListener("submit", handleOperationSubmit);

refreshRatesButton.addEventListener("click", () => {
  loadExchangeRates();
});

themeToggleButton.addEventListener("click", () => {
  toggleTheme();
});

nextRateButton.addEventListener("click", () => {
  showNextRate();
  startRateCarousel();
});

previousRateButton.addEventListener("click", () => {
  showPreviousRate();
  startRateCarousel();
});

applyTheme(getSavedTheme());
restoreSession();