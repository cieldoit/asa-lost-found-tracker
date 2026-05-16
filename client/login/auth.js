function showToast(message, type = "success") {
  const toast = document.createElement("div");

  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "25px";
  toast.style.right = "25px";
  toast.style.background = type === "success" ? "#166534" : "#b91c1c";
  toast.style.color = "white";
  toast.style.padding = "14px 22px";
  toast.style.borderRadius = "14px";
  toast.style.fontWeight = "700";
  toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
  toast.style.zIndex = "99999";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-15px)";
  toast.style.transition = "0.3s ease";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-15px)";
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}

const API_URL = window.ASA_API_BASE || `${window.location.origin}/api`;

async function sendRequest(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// LOGIN
const loginForm = document.querySelector("#loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    try {
      const data = await sendRequest("/login", { identifier, password });

      ["asa_token","asa_role","asa_user","token","role","userName"].forEach(k => localStorage.removeItem(k));
      localStorage.setItem("asa_token", data.token);
      localStorage.setItem("asa_role", data.role);
      localStorage.setItem("asa_user", data.userName);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userName", data.userName);

      showToast("Login successful! Redirecting...", "success");

      setTimeout(() => {
        const role = String(data.role || "").trim().toLowerCase();
        if (role === "student") {
          window.location.href = "/user/student.html";
        } else if (role === "staff") {
          window.location.href = "/user/staff.html";
        } else if (role === "visitor") {
          window.location.href = "/user/visitor.html";
        } else {
          window.location.href = "/user/admin.html";
        }
      }, 1500);

    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

// REGISTER
const registerForm = document.querySelector("#registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const role = document.querySelector("#role").value;

    try {
      const data = await sendRequest("/register", {
        name,
        email,
        password,
        role
      });

      showToast(data.message, "success");
      localStorage.setItem("pendingEmail", email);

      setTimeout(() => {
        window.location.href = "/login/verify-otp.html";
      }, 1500);

    } catch (error) {
      showToast(error.message, "error");
    }
  });
}
