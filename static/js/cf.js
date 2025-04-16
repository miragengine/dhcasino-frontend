document.addEventListener("DOMContentLoaded", () => {
  const heads_btn = document.getElementById("heads-btn");
  const tails_btn = document.getElementById("tails-btn");
  const bet_btn = document.getElementById("bet-btn");
  const coin = document.getElementById("coin");
  const result_box = document.getElementById("coin-result-box");
  const input = document.getElementById("bet-amount");
  const bet_wrapper = document.getElementById("bet-wrapper");
  const toggle_sound = document.getElementById("toggle-sound");
  const toggle_turbo = document.getElementById("toggle-turbo");

  const bet_sound = new Audio("/static/assets/bet.mp3");
  const win_sound = new Audio("/static/assets/win.mp3");

  let user_choice = "";
  let is_flipping = false;
  let currentBalance = 0;

  function formatUsd(amount) {
    return Number(amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    });
  }

  function update_balance() {
    fetch("https://3af6-31-32-166-161.ngrok-free.app/balance")
      .then(res => res.json())
      .then(b => {
        currentBalance = b.balance_usd;
        const el = document.getElementById("usd_balance");
        if (el) el.textContent = formatUsd(currentBalance);
      });
  }

  heads_btn.addEventListener("click", () => {
    user_choice = "Heads";
    heads_btn.classList.add("active");
    tails_btn.classList.remove("active");
  });

  tails_btn.addEventListener("click", () => {
    user_choice = "Tails";
    tails_btn.classList.add("active");
    heads_btn.classList.remove("active");
  });

  document.getElementById("half-btn").addEventListener("click", () => {
    let value = parseFloat(input.value) || 0;
    let newValue = value / 2;
    input.value = Math.min(newValue, currentBalance).toFixed(2);
  });

  document.getElementById("double-btn").addEventListener("click", () => {
    let value = parseFloat(input.value) || 0;
    let newValue = value * 2;
    input.value = Math.min(newValue, currentBalance).toFixed(2);
  });

  bet_btn.addEventListener("click", () => {
    if (!user_choice || is_flipping) return;
    const amount_usd = parseFloat(input.value);
    if (isNaN(amount_usd) || amount_usd <= 0) {
      bet_wrapper.style.border = "1px solid #b62b2e";
      bet_wrapper.style.borderRadius = "6px";
      return;
    }
    if (!toggle_sound.classList.contains("active-toggle")) {
      bet_sound.currentTime = 0;
      bet_sound.play();
    }
    bet(amount_usd);
  });

  function bet(display_amount_usd) {
    disable();
    coin.style.transition = "transform 0s";
    coin.style.transform = "rotateX(0deg)";
    let spinRounds = 6;
    fetch("https://3af6-31-32-166-161.ngrok-free.app/play-coinflip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: user_choice, amount: display_amount_usd })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        reset();
        return;
      }
      const result = data.result;
      const won = result === user_choice;
      const winnings = won ? (display_amount_usd * 2).toFixed(2) : "0.00";
      const final_rot = spinRounds * 360 + (result === "Heads" ? 0 : 180);
      const is_turbo = toggle_turbo.classList.contains("active-toggle");
      if (!is_turbo) {
        coin.style.transition = "transform 1.5s cubic-bezier(0.33, 1, 0.68, 1)";
        coin.style.transform = `rotateX(${final_rot}deg)`;
        setTimeout(() => {
          show_result(result, won, winnings, display_amount_usd);
        }, 1600);
      } else {
        coin.style.transition = "none";
        coin.style.transform = `rotateX(${final_rot}deg)`;
        show_result(result, won, winnings, display_amount_usd);
      }
    })
    .catch(() => {
      alert("Request failed. Try again.");
      reset();
    });
  }

  function show_result(result, won, winnings, display_amount_usd) {
    if (won) {
      result_box.querySelector(".coin-result-multiplier").textContent = "x2.00";
      result_box.querySelector(".coin-result-currency").textContent = formatUsd(winnings);
      result_box.classList.remove("hidden");
      if (!toggle_sound.classList.contains("active-toggle")) {
        win_sound.currentTime = 0;
        win_sound.play();
      }
    }

    const row = document.createElement("tr");
    row.classList.add(won ? "win" : "lose");
    row.innerHTML = `
      <td>Coinflip</td>
      <td>
        <img src="/static/assets/usd.svg" alt="$" style="width: 16px; vertical-align: middle; margin-right: 4px;">
        ${formatUsd(display_amount_usd)}
      </td>
      <td>${won ? "2.00x" : "0.00x"}</td>
      <td>
        <img src="/static/assets/usd.svg" alt="$" style="width: 16px; vertical-align: middle; margin-right: 4px;">
        ${won ? formatUsd(winnings) : `-${formatUsd(display_amount_usd)}`}
      </td>
    `;

    const table = document.getElementById("game-history-table");
    table.prepend(row);
    while (table.rows.length > 30) {
      table.deleteRow(table.rows.length - 1);
    }

    update_stats(won, display_amount_usd);
    update_balance();
    reset();
  }

  function disable() {
    input.disabled = true;
    heads_btn.disabled = true;
    tails_btn.disabled = true;
    document.getElementById("half-btn").disabled = true;
    document.getElementById("double-btn").disabled = true;
    bet_btn.disabled = true;
    result_box.classList.add("hidden");
    is_flipping = true;
  }

  function reset() {
    input.disabled = false;
    heads_btn.disabled = false;
    tails_btn.disabled = false;
    document.getElementById("half-btn").disabled = false;
    document.getElementById("double-btn").disabled = false;
    bet_btn.disabled = false;
    is_flipping = false;
  }

  update_balance();

  let stats = {
    wins: 0,
    losses: 0,
    wagered: 0,
    profit: 0
  };

  const profit_history = [];

  const profit_chart = new Chart(document.getElementById("profit-chart"), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          display: false,
          type: "linear",
          min: 0
        },
        y: {
          display: false
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  function update_stats(won, amount) {
    stats.wagered += amount;
    stats.profit += won ? amount : -amount;
    stats[won ? "wins" : "losses"]++;

    document.getElementById("stat-wins").textContent = stats.wins;
    document.getElementById("stat-losses").textContent = stats.losses;
    document.getElementById("stat-wagered").textContent = formatUsd(stats.wagered);

    const profit_el = document.getElementById("stat-profit");
    const formatted_profit = formatUsd(Math.abs(stats.profit));
    profit_el.className = stats.profit >= 0 ? "green" : "red";
    profit_el.textContent = stats.profit >= 0 ? formatted_profit : `-${formatted_profit}`;

    profit_history.push(stats.profit);

    if (profit_history.length === 1) {
      profit_history.unshift(profit_history[0]);
    }

    function interpolate_zero(x0, y0, x1, y1) {
      const t = y0 / (y0 - y1);
      const x = x0 + t * (x1 - x0);
      return { x, y: 0 };
    }

    function split_segments(data) {
      const segments = [];
      let current = [];
      for (let i = 0; i < data.length - 1; i++) {
        const y0 = data[i];
        const y1 = data[i + 1];
        const x0 = i;
        const x1 = i + 1;
        current.push({ x: x0, y: y0 });
        if ((y0 >= 0 && y1 < 0) || (y0 < 0 && y1 >= 0)) {
          const zero = interpolate_zero(x0, y0, x1, y1);
          current.push(zero);
          segments.push(current);
          current = [zero];
        }
      }
      current.push({ x: data.length - 1, y: data[data.length - 1] });
      segments.push(current);
      return segments;
    }

    const segments = split_segments(profit_history);

    const datasets = segments.map(segment => {
      const is_positive = segment.some(p => p.y > 0);
      return {
        data: segment,
        borderColor: is_positive ? "#00ff88" : "#ff2d2d",
        backgroundColor: is_positive ? "#2D6C4B" : "#782932",
        borderWidth: 2,
        fill: "origin",
        tension: 0.4,
        pointRadius: 0,
        parsing: false
      };
    });

    profit_chart.data.datasets = datasets;
    profit_chart.data.labels = profit_history.map((_, i) => i);
    profit_chart.options.scales.x.min = 0;
    profit_chart.options.scales.x.max = profit_history.length - 1;
    profit_chart.update();
  }

  document.getElementById("reset-stats").addEventListener("click", () => {
    stats = { wins: 0, losses: 0, wagered: 0, profit: 0 };
    profit_history.length = 0;
  
    document.getElementById("stat-wins").textContent = "0";
    document.getElementById("stat-losses").textContent = "0";
    document.getElementById("stat-wagered").textContent = "$0.00";
  
    const profit_el = document.getElementById("stat-profit");
    profit_el.textContent = "$0.00";
    profit_el.className = "green";
  
    profit_chart.data.labels = [];
    profit_chart.data.datasets = [];
    profit_chart.update();
  });  

  document.getElementById("toggle-stats").addEventListener("click", () => {
    const panel = document.getElementById("coinflip-stats");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  document.getElementById("close-stats").addEventListener("click", () => {
    document.getElementById("coinflip-stats").style.display = "none";
  });

  document.querySelectorAll(".footer-icon").forEach(icon => {
    icon.addEventListener("click", () => {
      icon.classList.toggle("active-toggle");
    });
  });

  const stats_panel = document.getElementById("coinflip-stats");
  let offset_x = 0, offset_y = 0, is_dragging = false;

  document.querySelector(".stats-header").addEventListener("mousedown", (e) => {
    is_dragging = true;
    offset_x = e.clientX - stats_panel.offsetLeft;
    offset_y = e.clientY - stats_panel.offsetTop;
    stats_panel.classList.add("dragging");
  });

  document.addEventListener("mouseup", () => {
    is_dragging = false;
    stats_panel.classList.remove("dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (is_dragging) {
      stats_panel.style.left = `${e.clientX - offset_x}px`;
      stats_panel.style.top = `${e.clientY - offset_y}px`;
    }
  });
});

const match_path = window.location.pathname
const match_id = match_path.startsWith("/host/") ? match_path.split("/").pop() : null

const socket = io();
let wait_box = null;
let timer_box = null;

if (match_id) {
  document.getElementById("bet-btn").style.display = "none";
  document.getElementById("bet-wrapper").style.display = "none";
  document.querySelector(".coin-buttons").style.display = "none";
  document.querySelector(".coinflip-left label").style.display = "none";

  socket.emit("join_flip", { id: match_id });

  socket.on("waiting_for_player", ({ id, waiting_for }) => {
    if (id !== match_id) return;
    if (wait_box) wait_box.remove();
    wait_box = document.createElement("div");
    wait_box.textContent = `Waiting for ${waiting_for} to open...`;
    Object.assign(wait_box.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "2rem",
      color: "white",
      zIndex: "10"
    });
    document.body.appendChild(wait_box);
  });

  socket.on("start_match", ({ id, result, start_time }) => {
    if (id !== match_id) return;
    if (wait_box) wait_box.remove();

    timer_box = document.createElement("div");
    Object.assign(timer_box.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "2rem",
      color: "white",
      zIndex: "10"
    });
    document.body.appendChild(timer_box);

    const countdown_end = start_time * 1000;
    const interval = setInterval(() => {
      const remaining = Math.ceil((countdown_end - Date.now()) / 1000);
      if (remaining > 0) {
        timer_box.textContent = `Starting in ${remaining}...`;
      } else {
        clearInterval(interval);
        timer_box.remove();
        const rot = result === "Heads" ? 0 : 180;
        coin.style.transition = "transform 1.5s cubic-bezier(0.33, 1, 0.68, 1)";
        coin.style.transform = `rotateX(${6 * 360 + rot}deg)`;
        setTimeout(() => {
          result_box.querySelector(".coin-result-multiplier").textContent = "x2.00";
          result_box.querySelector(".coin-result-currency").textContent = result;
          result_box.classList.remove("hidden");
        }, 1600);
      }
    }, 200);
  });

  fetch(`https://3af6-31-32-166-161.ngrok-free.app/api/flip/${match_id}`)
  .then(res => res.json())
  .then(data => {
    if (data.state === "countdown" && data.result && data.start_time) {
      socket.emit("join_flip", { id: match_id });
      const now = Date.now();
      const countdown_end = data.start_time * 1000;
      const remaining = Math.ceil((countdown_end - now) / 1000);

      if (remaining > 0) {
        if (wait_box) wait_box.remove();
        timer_box = document.createElement("div");
        Object.assign(timer_box.style, {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "2rem",
          color: "white",
          zIndex: "10"
        });
        document.body.appendChild(timer_box);

        const interval = setInterval(() => {
          const left = Math.ceil((countdown_end - Date.now()) / 1000);
          if (left > 0) {
            timer_box.textContent = `Starting in ${left}...`;
          } else {
            clearInterval(interval);
            timer_box.remove();
            const rot = data.result === "Heads" ? 0 : 180;
            coin.style.transition = "transform 1.5s cubic-bezier(0.33, 1, 0.68, 1)";
            coin.style.transform = `rotateX(${6 * 360 + rot}deg)`;
            setTimeout(() => {
              result_box.querySelector(".coin-result-multiplier").textContent = "x2.00";
              result_box.querySelector(".coin-result-currency").textContent = data.result;
              result_box.classList.remove("hidden");
            }, 1600);
          }
        }, 200);
      }
    } else if (data.waiting_for) {
      socket.emit("join_flip", { id: match_id });
      wait_box = document.createElement("div");
      wait_box.textContent = `Waiting for ${data.waiting_for} to open...`;
      Object.assign(wait_box.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "2rem",
        color: "white",
        zIndex: "10"
      });
      document.body.appendChild(wait_box);
    }

    fetch("https://3af6-31-32-166-161.ngrok-free.app/check_session")
      .then(r => r.json())
      .then(session => {
        if (!session.logged_in) return;

        const username = session.username;
        const is_host = username === data.host;
        const your_side = is_host ? data.host_side : data.guest_side;
        const opponent_side = is_host ? data.guest_side : data.host_side;
        const opponent_name = is_host ? data.guest : data.host;
        const bet_amount = isNaN(data.bet) ? "?" : Number(data.bet).toFixed(2);

        const info_box = document.createElement("div");
        Object.assign(info_box.style, {
          position: "absolute",
          top: "100px",
          left: "60px",
          color: "white",
          fontSize: "1rem",
          lineHeight: "1.8rem",
          zIndex: "10",
          background: "var(--color-gray800)",
          padding: "16px",
          border: "1px solid var(--color-gray600)",
          borderRadius: "12px",
          width: "220px",
          textAlign: "left"
        });

        info_box.innerHTML = `
          <div><b>Your Choice:</b> ${your_side}</div>
          <div><b>Opponent:</b> ${opponent_name}</div>
          <div><b>Opponent's Side:</b> ${opponent_side}</div>
          <div><b>Bet:</b> $${bet_amount}</div>
          <div><b>Win Chance:</b> 50%</div>
        `;

        document.querySelector(".coinflip-left")?.appendChild(info_box);
      });
  });
}
