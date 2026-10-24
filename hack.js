var form = document.getElementById("expenseForm");
var transactions = [];
try {
    var savedData = JSON.parse(
        localStorage.getItem("myExpenses") || "[]"
    );
    if (Array.isArray(savedData)) {
        transactions = savedData.filter(function(item) {
            return item &&
                typeof item.id === "string" &&
                (item.type === "income" || item.type === "expense") &&
                typeof item.amount === "number" &&
                Number.isFinite(item.amount) &&
                item.amount > 0 &&
                typeof item.category === "string" &&
                typeof item.date === "string" &&
                typeof item.description === "string";
        });
    }
} catch (error) {
    transactions = [];
}
var editingId = null;
var expenseChart = null;
var budgetAmount = Number(localStorage.getItem("myBudget")) || 0;
document.getElementById("date").value =
    new Date().toISOString().split("T")[0];
document.getElementById("budget").value = budgetAmount || "";
function saveData() {
    try {
        localStorage.setItem("myExpenses", JSON.stringify(transactions));
    } catch (error) {
        alert("Unable to save data in this browser.");
    }
}
function openForm() {
    document.getElementById("formPanel").hidden = false;
    document.getElementById("formPanel").scrollIntoView();
}
function closeForm() {
    form.reset();
    editingId = null;
    document.getElementById("formTitle").innerText = "Add Transaction";
    document.getElementById("saveButton").innerText = "Save Transaction";
    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];
    document.getElementById("formPanel").hidden = true;
}
form.addEventListener("submit", function(event) {
    event.preventDefault();
    var amount = Number(document.getElementById("amount").value);
    var date = document.getElementById("date").value;
    var today = new Date().toISOString().split("T")[0];
    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    if (!date || date > today) {
        alert("Please select a valid date.");
        return;
    }
    var item = {
        id: editingId || Date.now().toString(),
        type: document.getElementById("type").value,
        amount: Math.round(amount * 100) / 100,
        category: document.getElementById("category").value,
        date: date,
        description: document.getElementById("description").value.trim()
    };
    if (editingId !== null) {
        transactions = transactions.map(function(oldItem) {
            return oldItem.id === editingId ? item : oldItem;
        });
    } else {
        transactions.push(item);
    }
    saveData();
    closeForm();
    refresh();
});
function updateSummary() {
    var income = 0;
    var expenses = 0;
    transactions.forEach(function(item) {
        if (item.type === "income") {
            income += item.amount;
        } else {
            expenses += item.amount;
        }
    });
    document.getElementById("income").innerText =
        "₹" + income.toFixed(2);
    document.getElementById("expenses").innerText =
        "₹" + expenses.toFixed(2);
    document.getElementById("balance").innerText =
        "₹" + (income - expenses).toFixed(2);
    document.getElementById("count").innerText = transactions.length;
}
function showTransactions() {
    var list = document.getElementById("transactionList");
    var search = document.getElementById("search").value.toLowerCase();
    var filter = document.getElementById("filterType").value;
    list.innerHTML = "";
    var count = 0;
    transactions
        .filter(function(item) {
            return (
                (item.description.toLowerCase().includes(search) ||
                 item.category.toLowerCase().includes(search)) &&
                (filter === "all" || item.type === filter)
            );
        })
        .sort(function(a, b) {
            return b.date.localeCompare(a.date);
        })
        .forEach(function(item) {
            var row = list.insertRow();
            row.insertCell().innerText = item.date;
            row.insertCell().innerText = item.description || "-";
            row.insertCell().innerText = item.category;
            var typeCell = row.insertCell();
            typeCell.innerText = item.type === "income" ? "Income" : "Expense";
            typeCell.className = item.type === "income"
                ? "income-text" : "expense-text";
            var amountCell = row.insertCell();
            amountCell.innerText =
                (item.type === "income" ? "+" : "-") +
                " ₹" + item.amount.toFixed(2);
            amountCell.className = typeCell.className;
            var actions = row.insertCell();
            var edit = document.createElement("button");
            edit.innerText = "Edit";
            edit.className = "edit-btn";
            edit.onclick = function() {
                editingId = item.id;
                document.getElementById("type").value = item.type;
                document.getElementById("amount").value = item.amount;
                document.getElementById("category").value = item.category;
                document.getElementById("date").value = item.date;
                document.getElementById("description").value =
                    item.description;
                document.getElementById("formTitle").innerText =
                    "Edit Transaction";
                document.getElementById("saveButton").innerText =
                    "Update Transaction";
                openForm();
            };
            var del = document.createElement("button");
            del.innerText = "Delete";
            del.className = "delete-btn";
            del.onclick = function() {
                if (confirm("Delete this transaction?")) {
                    transactions = transactions.filter(function(t) {
                        return t.id !== item.id;
                    });
                    if (editingId === item.id) {
                        closeForm();
                    }
                    saveData();
                    refresh();
                }
            };
            actions.append(edit, del);
            count++;
        });

    document.getElementById("emptyMessage").hidden = count > 0;
}
function setBudget() {
    var value = Number(document.getElementById("budget").value);
    if (!Number.isFinite(value) || value <= 0) {
        alert("Enter a valid monthly budget.");
        return;
    }
    budgetAmount = value;
    localStorage.setItem("myBudget", budgetAmount);
    updateBudget();
}
function updateBudget() {
    var spent = 0;
    var today = new Date();
    transactions.forEach(function(item) {
        var date = new Date(item.date + "T12:00:00");
        if (
            item.type === "expense" &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        ) {
            spent += item.amount;
        }
    });
    var percent = budgetAmount > 0 ? spent / budgetAmount * 100 : 0;
    document.getElementById("budgetInfo").innerText =
        "This month: ₹" + spent.toFixed(2) +
        " spent out of ₹" + budgetAmount.toFixed(2);
    document.getElementById("progressBar").style.width =
        Math.min(percent, 100) + "%";
    document.getElementById("progressBar").style.background =
        percent >= 100 ? "#dc4545" : "#6655db";
    document.getElementById("budgetMessage").innerText =
        budgetAmount === 0
            ? "Set your budget to start tracking."
            : percent >= 100
                ? "Budget limit reached! Review your spending."
                : percent >= 80
                    ? "Warning: You have used most of your budget."
                    : "Good job! Spending is within your budget.";
}
function updateChart() {
    var totals = {};
    transactions.forEach(function(item) {
        if (item.type === "expense") {
            totals[item.category] =
                (totals[item.category] || 0) + item.amount;
        }
    });
    var labels = Object.keys(totals);
    var values = Object.values(totals);
    var canvas = document.getElementById("expenseChart");
    if (expenseChart) {
        expenseChart.destroy();
    }
    expenseChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels.length ? labels : ["No expenses yet"],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: labels.length
                    ? [
                        "#6655db", "#16a36a", "#e45454",
                        "#e7a525", "#35a9a0", "#ef8b45",
                        "#3876c5", "#cc79a7"
                    ]
                    : ["#e5e7eb"],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 18,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (labels.length === 0) {
                                return "No expenses yet";
                            }
                            return context.label + ": ₹" +
                                Number(context.raw).toFixed(2);
                        }
                    }
                }
            }
        }
    });
    var total = values.reduce(function(a, b) {
        return a + b;
    }, 0);
    document.getElementById("tip").innerText =
        total === 0
            ? "Add expenses to see your spending summary."
            : "Your recorded expenses total ₹" + total.toFixed(2) +
              ". Review your highest spending category to find savings.";
}
function refresh() {
    updateSummary();
    showTransactions();
    updateBudget();
    updateChart();
}
document.getElementById("search").addEventListener(
    "input", showTransactions
);
document.getElementById("filterType").addEventListener(
    "change", showTransactions
);
refresh();
