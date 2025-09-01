// =======================
// Util
// =======================
const rupiah = (n) => Number(n).toLocaleString("id-ID");

// =======================
// State
// =======================
let cart = []; // {id, name, price, img, qty}
let menus = [];
let currentCategory = "all";

// =======================
// Elements
// =======================
const grid = document.getElementById("menu-grid");
const cartBtn = document.getElementById("cart-btn");
const cartCount = document.getElementById("cart-count");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const catBtns = Array.from(document.querySelectorAll(".cat-btn"));
const themeToggle = document.getElementById("theme-toggle");

const cartModal = document.getElementById("cart-modal");
const closeCart = document.getElementById("close-cart");
const cartItemsBox = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

const checkoutModal = document.getElementById("checkout-modal");
const closeCheckout = document.getElementById("close-checkout");
const checkoutItemsBox = document.getElementById("checkout-items");
const checkoutTotalEl = document.getElementById("checkout-total");
const customerName = document.getElementById("customer-name");
const confirmPayBtn = document.getElementById("confirm-payment-btn");

const receiptModal = document.getElementById("receipt-modal");
const closeReceipt = document.getElementById("close-receipt");
const receiptContent = document.getElementById("receipt-content");
const finishBtn = document.getElementById("finish-btn");

// =======================
// Helpers
// =======================
function open(el) {
  el.style.display = "flex";
}
function close(el) {
  el.style.display = "none";
}
function updateBadge() {
  cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

// =======================
// Sidebar toggle
// =======================
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// =======================
// Category buttons
// =======================
catBtns.forEach((b) => {
  b.addEventListener("click", () => {
    catBtns.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    currentCategory = b.dataset.cat;
    renderMenus();
  });
});
// =======================
// Load menus
// =======================
async function loadMenus() {
  const res = await fetch("/api/menus");
  menus = await res.json();
  renderMenus();
}
// =======================
// Render menus
// =======================
function renderMenus() {
  const filtered = menus.filter((m) =>
    currentCategory === "all" ? true : m.kategori === currentCategory
  );

  grid.innerHTML = filtered
    .map(
      (it) => `
      <div class="menu-item" data-id="${it.id}">
        <img src="${it.gambar || "/static/images/fallback.png"}" 
             alt="${it.nama}" 
             onerror="this.src='/static/images/fallback.png'"/>
        <h3>${it.nama}</h3>
        <p class="price">Rp ${rupiah(it.harga)}</p>
        <button class="add-to-cart">Tambah</button>
      </div>`
    )
    .join("");

  // bind add buttons
  grid.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".menu-item");
      const id = Number(card.dataset.id);
      const m = menus.find((x) => x.id === id);
      if (!m) return;

      const found = cart.find((x) => x.id === id);
      if (found) {
        found.qty++;
      } else {
        cart.push({
          id: m.id,
          name: m.nama,
          price: m.harga,
          img: m.gambar || "/static/images/fallback.png",
          qty: 1,
        });
      }
      updateBadge();
    });
  });
}

// =======================
// Render cart
// =======================
function renderCart() {
  cartItemsBox.innerHTML = "";
  let total = 0;

  cart.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${it.img}" alt="${it.name}" 
           onerror="this.src='/static/images/fallback.png'"/>
      <div>
        <div><strong>${it.name}</strong></div>
        <div>Rp ${rupiah(it.price)} / item</div>
      </div>
      <div style="text-align:right">
        <div class="qty">
          <button data-act="dec" data-idx="${idx}">−</button>
          <span style="margin:0 8px">${it.qty}</span>
          <button data-act="inc" data-idx="${idx}">+</button>
        </div>
        <div>Rp ${rupiah(it.price * it.qty)}</div>
        <button data-act="del" data-idx="${idx}" style="margin-top:6px">Hapus</button>
      </div>
    `;
    cartItemsBox.appendChild(row);
    total += it.price * it.qty;
  });

  cartTotalEl.textContent = rupiah(total);

  cartItemsBox.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.dataset.idx);
      const act = b.dataset.act;
      if (act === "inc") cart[idx].qty++;
      if (act === "dec") cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      if (act === "del") cart.splice(idx, 1);
      renderCart();
      updateBadge();
    });
  });
}

// =======================
// Render checkout
// =======================
function renderCheckout() {
  checkoutItemsBox.innerHTML = "";
  let total = 0;

  cart.forEach((it) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "12px";
    row.style.alignItems = "center";
    row.style.padding = "8px 0";
    row.innerHTML = `
      <img src="${it.img}" 
           style="width:56px;height:56px;object-fit:cover;border-radius:8px"/>
      <div>
        <strong>${it.name}</strong> x${it.qty}
        <div>Rp ${rupiah(it.price * it.qty)}</div>
      </div>
    `;
    checkoutItemsBox.appendChild(row);
    total += it.price * it.qty;
  });

  checkoutTotalEl.textContent = rupiah(total);
}

// =======================
// Events
// =======================
cartBtn.addEventListener("click", () => {
  renderCart();
  open(cartModal);
});
closeCart.addEventListener("click", () => close(cartModal));

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Keranjang kosong");
    return;
  }
  close(cartModal);
  renderCheckout();
  open(checkoutModal);
});
closeCheckout.addEventListener("click", () => close(checkoutModal));

// Confirm payment
confirmPayBtn.addEventListener("click", async () => {
  const nama = (customerName.value || "").trim();
  if (!nama) {
    alert("Nama pembeli harus diisi");
    return;
  }
  const nomorMeja = (document.getElementById("nomorMeja").value || "").trim();
  if (!nomorMeja) {
    alert("Nomor meja harus diisi");
    return;
  }

  const payload = {
    nama,
    nomor_meja: nomorMeja,
    cart: cart.map((i) => ({ id: i.id, qty: i.qty })),
  };

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const out = await res.json();
  if (!out.ok) {
    alert(out.msg || "Gagal membuat pesanan");
    return;
  }

  // Tampilkan struk
  const tgl = new Date().toLocaleString("id-ID");
  const itemsStr = cart
    .map((i) => `• ${i.name} x${i.qty}  Rp ${rupiah(i.price * i.qty)}`)
    .join("\n");

  receiptContent.textContent = `JUALANKU
No. Order : ORD${String(out.order_id).padStart(6, "0")}
Tanggal   : ${tgl}
Nama      : ${nama}
Nomor Meja: ${nomorMeja}
Metode    : QRIS

Rincian:
${itemsStr}

Total     : Rp ${rupiah(out.total)}
Status    : Transaksi Berhasil ✅

Terima kasih!`;

  close(checkoutModal);
  open(receiptModal);
  cart = [];
  updateBadge();
});

// Receipt
closeReceipt.addEventListener("click", () => close(receiptModal));
finishBtn.addEventListener("click", () => close(receiptModal));

// Close modals with backdrop
[cartModal, checkoutModal, receiptModal].forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) close(m);
  });
});
// Theme toggle + topbar
const themetoggle = document.getElementById("theme-toggle");
const topbar = document.getElementById("topbar");

let isDark = true; // default malam
document.body.classList.add("dark");
topbar.style.backgroundImage = "url('night.gif')";
themetoggle.textContent = "🌙";

themeToggle.addEventListener("click", () => {
  isDark = !isDark;

  if (isDark) {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    topbar.style.backgroundImage = "url('night.gif')";
    themetoggle.textContent = "🌙";
  } else {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    topbar.style.backgroundImage = "url('morning.gif')";
    themetoggle.textContent = "🌞";
  }
});
function animateCart() {
  const cartBtn = document.getElementById("cart-btn");
  if (!cartBtn) return;

  cartBtn.classList.remove("shake");
  void cartBtn.offsetWidth; // reset animasi biar bisa dipicu berulang
  cartBtn.classList.add("shake");
}

// contoh trigger tiap kali nambah item ke keranjang
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("add-to-cart")) {
    animateCart();
  }
});

// kalau kamu udah punya fungsi addToCart, panggil aja animateCart() di situ
// =======================
// Init
// =======================
loadMenus();

