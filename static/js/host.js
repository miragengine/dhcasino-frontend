const socket = io()

document.addEventListener("DOMContentLoaded", () => {
  const flipList = document.getElementById("flip-list")
  const form = document.getElementById("create-flip-form")
  const flips = {}
  let currentUser = null

  fetch("https://3af6-31-32-166-161.ngrok-free.app/check_session")
    .then(res => res.json())
    .then(user => {
      if (user.logged_in) {
        currentUser = user.username
      }
    })

    socket.on("balance_update", (data) => {
      fetch("https://3af6-31-32-166-161.ngrok-free.app/check_session")
          .then(res => res.json())
          .then(user => {
            if (user.logged_in && user.username === data.username) {
              const usd = document.getElementById("usd_balance")
              if (usd) {
                usd.textContent = `$${parseFloat(data.balance).toFixed(2)}`
              }
            }
          })
      })

      socket.on("available_flips", (flipData) => {
        flipList.innerHTML = ""
        flipData.slice().reverse().forEach(flip => {
          flips[flip.id] = flip
          const li = document.createElement("li")
          li.id = `flip-${flip.id}`
          li.innerHTML = renderFlip(flip)
          flipList.appendChild(li)
        })
        bindOpenButtons()
      })      

  socket.on("flip_updated", (flip) => {
    flips[flip.id] = flip
    const li = document.getElementById(`flip-${flip.id}`)
    if (li) {
      li.innerHTML = renderFlip(flip)
      bindOpenButtons()
    }
  })

  socket.on("flip_resolved", ({ id, result }) => {
    const flip = flips[id];
    if (flip) {
      const li = document.getElementById(`flip-${id}`);
      if (li) {
        const winner = (result === flip.side) ? flip.host : flip.guest;
        const loser = (result !== flip.side) ? flip.host : flip.guest;
  
        const hostIsWinner = winner === flip.host;
  
        const finishedAt = Date.now();
        const ago = formatTimeAgo(finishedAt);
  
        const hostColor = hostIsWinner ? "#6bff4d" : "white";
        const guestColor = !hostIsWinner ? "#6bff4d" : "white";
  
        const hostAvatar = `https://cdn.discordapp.com/avatars/${flip.host_id}/${flip.host_avatar}.png`;
        const guestAvatar = `https://cdn.discordapp.com/avatars/${flip.guest_id}/${flip.guest_avatar}.png`;
  
        li.innerHTML = `
          <div class="flip-card">
            <img src="${hostAvatar}" class="flip-avatar">
            <span style="color:${hostColor}; font-weight: 600;">${flip.host}</span>
            vs
            <img src="${guestAvatar}" class="flip-avatar">
            <span style="color:${guestColor}; font-weight: 600;">${flip.guest}</span>
            - $${parseFloat(flip.bet).toFixed(2)}
            <span class="flip-date">• ${ago}</span>
            <span class="flip-result">${result} won</span>
          </div>
        `;
      }
    }
  });  

  socket.on("waiting_for_player", ({ id, waiting_for }) => {
    const li = document.getElementById(`flip-${id}`)
    if (li) {
      const existing = li.querySelector(".waiting-text")
      if (!existing) {
        const wait = document.createElement("div")
        wait.classList.add("waiting-text")
        wait.style.color = "#ccc"
        wait.textContent = `Waiting for ${waiting_for}...`
        li.appendChild(wait)
      }
    }
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const side = document.getElementById("flip-side").value
    const amount = parseFloat(document.getElementById("flip-amount").value)
    if (isNaN(amount) || amount <= 0) return
    const res = await fetch("https://3af6-31-32-166-161.ngrok-free.app/host-flip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, amount })
    })
    const data = await res.json()
    if (!data.success) alert(data.error || "Error")
  })

  window.joinFlip = function (id) {
    socket.emit("join_flip", { id })
  }

  function bindOpenButtons() {
    document.querySelectorAll(".open-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id")
        window.open(`/host/${id}`, "_blank")
        fetch("/check_session")
          .then(res => res.json())
          .then(user => {
            if (user.logged_in) {
              socket.emit("click_open", { id, user: user.username })
            }
          })
      })
    })
  }

  function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s ago`;
  }
  
  function createFlipElement(flip) {
    const wrapper = document.createElement("div");
    wrapper.className = "flip-row";
  
    const isHostWinner = flip.winner === flip.host.name;
  
    const hostColor = isHostWinner ? "green" : "white";
    const joinColor = !isHostWinner ? "green" : "white";
  
    const dateStr = formatTimeAgo(flip.finishedAt);
  
    wrapper.innerHTML = `
      <div class="flip-card">
        <img src="${flip.host.avatar}" class="flip-avatar">
        <span style="color: ${hostColor}">${flip.host.name}</span> vs 
        <img src="${flip.join.avatar}" class="flip-avatar">
        <span style="color: ${joinColor}">${flip.join.name}</span> 
        - $${flip.amount.toFixed(2)}
        <span class="flip-date">• ${dateStr}</span>
        <span class="flip-result">${flip.result} won</span>
      </div>
    `;
  
    return wrapper;
  }  
  
  function renderFlip(flip) {
    if (!flip.guest) {
      return `
        <div class="flip-card">
          <strong>${flip.host}</strong> wants ${flip.side} - $${parseFloat(flip.bet).toFixed(2)}
          <button class="register-button" onclick="joinFlip('${flip.id}')">Join</button>
        </div>
      `
    }
  
    const isWaitingForOpen = flip.state === "open"
    const alreadyOpened = flip.opened?.includes(currentUser)
    const showBtn = isWaitingForOpen && !alreadyOpened && (
      currentUser === flip.host || currentUser === flip.guest
    )
    const btn = showBtn
      ? `<button class="register-button open-btn" data-id="${flip.id}">Open</button>`
      : isWaitingForOpen
        ? `<button class="register-button" disabled style="opacity:0.6; cursor: default;">Waiting...</button>`
        : ""
  
    if (flip.state === "done") {
      const winner = flip.winner
      const hostWinner = winner === flip.host
      const hostColor = hostWinner ? "#6bff4d" : "white"
      const guestColor = !hostWinner ? "#6bff4d" : "white"
      const hostAvatar = `https://cdn.discordapp.com/avatars/${flip.host_id}/${flip.host_avatar}.png`
      const guestAvatar = `https://cdn.discordapp.com/avatars/${flip.guest_id}/${flip.guest_avatar}.png`
      const timeAgo = formatTimeAgo(flip.finishedAt)
  
      return `
      <div class="flip-card">
        <div class="flip-players">
          <img src="${hostAvatar}" class="flip-avatar">
          <span style="color:${hostColor}; font-weight: 600;">${flip.host}</span>
          <span style="opacity: 0.6;">vs</span>
          <img src="${guestAvatar}" class="flip-avatar">
          <span style="color:${guestColor}; font-weight: 600;">${flip.guest}</span>
        </div>
        <div class="flip-meta">
          <span>$${parseFloat(flip.bet).toFixed(2)}</span>
          <span class="flip-date" data-timestamp="${flip.finishedAt}">${formatTimeAgo(flip.finishedAt)}</span>
          <span class="flip-result">${flip.result} won</span>
        </div>
      </div>
    `    
    }
  
    return `
      <div class="flip-card">
        <div>
          <strong>${flip.host}</strong> vs <strong>${flip.guest}</strong> - $${parseFloat(flip.bet).toFixed(2)}
        </div>
        ${btn}
      </div>
    `
  }  
})
