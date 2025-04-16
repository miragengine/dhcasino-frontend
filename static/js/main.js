
document.getElementById("page-loader").style.display = "none";

setTimeout(() => {
  const loader = document.getElementById("page-loader");
  loader.classList.add("hidden");

  setTimeout(() => {
    loader.style.display = "none";
  }, 500);
}, 800);

document.addEventListener("DOMContentLoaded", function() {
  const usd_bal = document.getElementById("usd_balance");
  if (!usd_bal) return;

  const menu_toggle = document.querySelector(".menu-toggle");
  if (menu_toggle) {
    menu_toggle.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) sidebar.classList.toggle("expanded");
    });
  }

  const login_overlay = document.getElementById("login-overlay");
  const auth_container = document.querySelector(".auth-container");

  const login_btn = document.querySelector(".login-button");
  if (login_btn && login_overlay && auth_container) {
    login_btn.addEventListener("click", () => {
      login_overlay.classList.add("active");
      auth_container.style.animationName = "none";
      auth_container.offsetHeight;
      auth_container.style.animationName = "auth-slide-in";
    });
  }

  if (login_overlay && auth_container) {
    login_overlay.addEventListener("click", (e) => {
      if (e.target === login_overlay) {
        auth_container.style.animationName = "auth-slide-out";
        setTimeout(() => {
          login_overlay.classList.remove("active");
        }, 300);
      }
    });
  }

  window.addEventListener("click", function(e) {
    if (e.target.classList.contains("overlay")) {
      e.target.classList.remove("active");
    }
  });

  function update_ui(logged_in, username, avatar, user_id) {
    const header_section = document.getElementById("header-section");
    const withdraw_section = document.getElementById("withdraw-section-protection");
    const ltc_address = document.getElementById("ltc_address");
    const cas_games_section = document.getElementById("casino-games-section");
    const logout_btn = document.getElementById("logout-btn");
    const login_btn = document.querySelector(".login-button");
    const withdraw_btn = document.querySelector(".withdraw-button");
    const wallet_btn = document.querySelector(".wallet-button");
    const p = document.getElementById("usd_balance");
    const user_info = document.getElementById("user-info");
    const avatar_img = document.getElementById("discord-avatar");
    const name_span = document.getElementById("discord-name");

    if (logged_in) {
      if (logout_btn) logout_btn.style.display = "inline-block";
      if (login_btn) login_btn.style.display = "none";
      if (withdraw_btn) withdraw_btn.style.display = "inline-block";
      if (wallet_btn) wallet_btn.style.display = "inline-block";
      if (p) p.style.display = "inline-block";
      if (header_section) header_section.style.display = "block";
      if (cas_games_section) cas_games_section.style.display = "block";
      if (withdraw_section) withdraw_section.style.display = "block";
      if (ltc_address) ltc_address.style.display = "block";
      if (login_btn) login_btn.style.display = "none";
      if (user_info) user_info.style.display = "flex";
      if (logout_btn) logout_btn.style.display = "inline-block";
      if (avatar_img && user_id && avatar) {
        avatar_img.src = `https://cdn.discordapp.com/avatars/${user_id}/${avatar}.png`;
      }
      if (name_span) name_span.textContent = username;
      if (header_section) header_section.style.display = "block";
    } else {
      if (logout_btn) logout_btn.style.display = "none";
      if (login_btn) login_btn.style.display = "inline-block";
      if (withdraw_btn) withdraw_btn.style.display = "none";
      if (wallet_btn) wallet_btn.style.display = "none";
      if (p) p.style.display = "none";
      if (header_section) header_section.style.display = "none";
      if (cas_games_section) cas_games_section.style.display = "none";
      if (withdraw_section) withdraw_section.style.display = "none";
      if (ltc_address) ltc_address.style.display = "none";
      if (login_btn) login_btn.style.display = "inline-block";
      if (user_info) user_info.style.display = "none";
      if (logout_btn) logout_btn.style.display = "none";
      if (header_section) header_section.style.display = "none";
    }
  }

  const overlay = document.getElementById("wallet-overlay");
  const container = document.querySelector(".wallet-container");

  document.querySelector(".wallet-button").addEventListener("click", () => {
    overlay.classList.add("active");
    container.style.animationName = "none";
    container.offsetHeight;
    container.style.animationName = "slide-in";
  });

  if (overlay && container) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        container.style.animationName = "slide-out";
        setTimeout(() => {
          overlay.classList.remove("active");
        }, 300);
      }
    });
  }

  const deposit_tab = document.getElementById("deposit-tab");
  if (deposit_tab) {
    deposit_tab.addEventListener("click", function() {
      document.getElementById("wallet-deposit").style.display = "block";
      document.getElementById("wallet-withdraw").style.display = "none";
      this.classList.add("active");
      document.getElementById("withdraw-tab").classList.remove("active");
    });
  }

  const withdraw_tab = document.getElementById("withdraw-tab");
  if (withdraw_tab) {
    withdraw_tab.addEventListener("click", function() {
      document.getElementById("wallet-deposit").style.display = "none";
      document.getElementById("wallet-withdraw").style.display = "block";
      this.classList.add("active");
      document.getElementById("deposit-tab").classList.remove("active");
    });
  }

  const login_btn_final = document.getElementById("login-btn");
  if (login_btn_final) {
    login_btn_final.addEventListener("click", function() {
      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value.trim();

      fetch("https://0853-31-32-166-161.ngrok-free.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          update_ui(true, data.username);
          const loginOverlayEl = document.getElementById("login-overlay");
          if (loginOverlayEl) loginOverlayEl.classList.remove("active");
        } else {
          console.error("login failed:", data.error);
        }
      });
    });
  }

  const logout_btn = document.getElementById("logout-btn");
  if (logout_btn) {
    logout_btn.addEventListener("click", function() {
      fetch("https://0853-31-32-166-161.ngrok-free.app/logout", { method: "POST" })
        .then(res => res.json())
        .then(() => {
          update_ui(false, "");
        });
    });
  }

  window.onload = function() {
    fetch("https://0853-31-32-166-161.ngrok-free.app/check_session")
      .then(res => res.json())
      .then(data => {
        if (data.logged_in) {
          update_ui(true, data.username, data.avatar, data.user_id);
        } else {
          update_ui(false);
        }
      });
  };

  function fetch_bal() {
    fetch("https://0853-31-32-166-161.ngrok-free.app/balance")
      .then(response => response.json())
      .then(data => {
        if (data.error || data.balance_usd === undefined) {
          usd_bal.textContent = "$-";
        } else {
          usd_bal.textContent = `$${data.balance_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      })
      .catch(() => {
        usd_bal.textContent = "$-";
      });
  }

  fetch_bal();
  
});
