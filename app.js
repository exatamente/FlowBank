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

const balanceValue = document.getElementById("balance-value");
const transactionList = document.getElementById("transaction-list");

const USERS_STORAGE_KEY = "flowbank_users";
const SESSION_STORAGE_KEY = "flowbank_session";

let selectedGoal = "Organizar gastos";

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

function saveSession(email) {
  localStorage.setItem(SESSION_STORAGE_KEY, email);
}

function getSession() {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatTransactionDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function createDefaultTransactions() {
  return [
    {
      description: "Salário",
      amount: 3200,
      type: "income",
      date: "2026-05-25"
    },
    {
      description: "Mercado Bom Preço",
      amount: -86.4,
      type: "expense",
      date: "2026-05-26"
    },
    {
      description: "Streaming",
      amount: -29.9,
      type: "expense",
      date: "2026-05-27"
    }
  ];
}

function createDefaultUser(name, email, password) {
  return {
    name,
    email,
    password,
    onboarded: false,
    goal: null,
    balance: 2840.75,
    transactions: createDefaultTransactions()
  };
}

function updateDashboard(user) {
  dashboardUserName.textContent = `Olá, ${user.name}`;
  balanceValue.textContent = formatCurrency(user.balance);

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

function handleAuthenticatedUser(user) {
  updateDashboard(user);

  if (user.onboarded) {
    showScreen("dashboard-screen");
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
  const sessionEmail = getSession();

  if (!sessionEmail) {
    showScreen("welcome-screen");
    return;
  }

  const user = findUserByEmail(sessionEmail);

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
  const sessionEmail = getSession();

  if (!sessionEmail) {
    showScreen("welcome-screen");
    return;
  }

  const user = findUserByEmail(sessionEmail);

  if (!user) {
    clearSession();
    showScreen("welcome-screen");
    return;
  }

  handleAuthenticatedUser(user);
}

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

finishOnboardingButton.addEventListener("click", () => {
  finishOnboarding();
});

logoutButton.addEventListener("click", () => {
  logoutUser();
});

refreshRatesButton.addEventListener("click", () => {
  console.log("Aqui entraremos depois com a chamada da API de cotações.");
});

restoreSession();