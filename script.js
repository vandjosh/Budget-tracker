const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");

let total = 0;

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    total += amount;
    totalDisplay.textContent = total.toFixed(2);

    const li = document.createElement("li");
    li.textContent = `${name} - $${amount} (${category})`;

    list.appendChild(li);

    form.reset();
});
