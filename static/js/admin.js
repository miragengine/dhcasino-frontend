const socket = io();

function showToast(msg) {
    const toast = document.getElementById("admin-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }  

  
document.addEventListener("DOMContentLoaded", () => {
    const connectedTable = document.getElementById("connected-players");
    const playingTable = document.getElementById("playing-players");
    const logsTable = document.getElementById("game-logs");
    const playerSearch = document.getElementById("player-search");
    const playerInfo = document.getElementById("player-info");
    const summaryTableBody = document.querySelector("#summary-table tbody");

    const fetchAndRender = async (url, table, headers, rowFn) => {
        if (!table) return;
        const res = await fetch(url);
        const data = await res.json();
        let html = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
        html += data.map(rowFn).join("");
        table.innerHTML = html;
    };

    function reloadAdminPanel() {
        fetchAndRender("https://0853-31-32-166-161.ngrok-free.app/admin/api/connected", connectedTable, ["Username"], (name) =>
            `<tr><td>${name}</td></tr>`
        );

        fetchAndRender("https://0853-31-32-166-161.ngrok-free.app/admin/api/active-players", playingTable, ["Username"], (name) =>
            `<tr><td>${name}</td></tr>`
        );

        fetch("https://0853-31-32-166-161.ngrok-free.app/admin/api/logs")
            .then(res => res.json())
            .then(data => {
                if (!logsTable) return;
                let html = "<tr><th>Host</th><th>Guest</th><th>Bet</th><th>Winner</th><th>Time</th></tr>";
                data.forEach(log => {
                    html += `<tr>
                        <td>${log.host}</td>
                        <td>${log.guest || "-"}</td>
                        <td>$${parseFloat(log.bet).toFixed(2)}</td>
                        <td>${log.winner || "-"}</td>
                        <td>${new Date(log.finishedAt).toLocaleString()}</td>
                    </tr>`;
                });
                logsTable.innerHTML = html;
            });

            fetch("https://0853-31-32-166-161.ngrok-free.app/admin/api/users")
            .then(res => res.json())
            .then(users => {
                fetch("https://0853-31-32-166-161.ngrok-free.app/admin/api/logs")
                    .then(res => res.json())
                    .then(logs => {
                        const wins = {};
                        const totals = {};
                        logs.forEach(log => {
                            const { host, guest, winner } = log;
                            if (host) totals[host] = (totals[host] || 0) + 1;
                            if (guest) totals[guest] = (totals[guest] || 0) + 1;
                            if (winner) wins[winner] = (wins[winner] || 0) + 1;
                        });

                        summaryTableBody.innerHTML = users.map(user => {
                            const u = user.username;
                            const rawBalance = parseFloat(user.balance || 0);
                            const balanceFormatted = `${rawBalance < 0 ? '-' : ''}$${Math.abs(rawBalance).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                            const total = totals[u] || 0;
                            const win = wins[u] || 0;
                            const winrate = total ? `${((win / total) * 100).toFixed(1)}%` : "0%";
                            const profit = logs
                                .filter(f => f.host === u || f.guest === u)
                                .reduce((acc, f) => acc + (f.winner === u ? f.bet : -f.bet), 0);
                            const formattedProfit = `${profit >= 0 ? '+' : '-'}$${Math.abs(profit).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                            const profitColor = profit === 0 ? 'white' : (profit > 0 ? 'limegreen' : 'var(--color-red)');
                            return `
                                <tr>
                                    <td>${u}</td>
                                    <td>
                                        <div style="display: flex; gap: 6px; align-items: center;">
                                            <input type="text" class="admin-input add-fund-input" placeholder="Enter a amount" data-user="${u}">
                                            <button class="fund-submit-btn" data-user="${u}" style="padding: 5px 10px; cursor: pointer;">Submit</button>
                                        </div>
                                    </td>
                                    <td>${balanceFormatted}</td>
                                    <td>${winrate}</td>
                                    <td style="color:${profitColor}">${formattedProfit}</td>
                                    <td>${total}</td>
                                </tr>`;
                        }).join('');
                    });
            });
    }

    reloadAdminPanel();

    playerSearch.addEventListener("input", async () => {
        const username = playerSearch.value.trim();
        if (!username) {
            playerInfo.innerHTML = "";
            return;
        }
        const res = await fetch(`https://0853-31-32-166-161.ngrok-free.app/admin/api/player/${username}`);
        const data = await res.json();
        if (data.error) {
            playerInfo.innerHTML = `<p style="color:red;">${data.error}</p>`;
        } else {
            playerInfo.innerHTML = `
                <p><strong>Username:</strong> ${data.username}</p>
                <p><strong>Balance:</strong> $${data.balance}</p>
                <p><strong>Profit:</strong> ${data.profit >= 0 ? "+" : "-"}$${Math.abs(data.profit)}</p>
                <p><strong>Hosted Flips:</strong> ${data.hosted_flips}</p>
                <p><strong>Joined At:</strong> ${data.joined_at}</p>
            `;
        }
    });

    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("fund-submit-btn")) {
            const username = e.target.dataset.user;
            const input = document.querySelector(`.add-fund-input[data-user="${username}"]`);
            const amount = parseFloat(input.value.trim());
            if (!username || isNaN(amount)) return;
    
            const res = await fetch("https://0853-31-32-166-161.ngrok-free.app/admin/api/change-balance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, amount })
            });
    
            const data = await res.json();
            if (data.message) {
                showToast(data.message);
                reloadAdminPanel();
            } else if (data.error) {
                showToast(data.error);
            }
            console.log("API RESPONSE:", data);
        }
    });    

    socket.on("flip_updated", () => reloadAdminPanel());
    socket.on("flip_resolved", () => reloadAdminPanel());
    socket.on("balance_update", () => reloadAdminPanel());
});
