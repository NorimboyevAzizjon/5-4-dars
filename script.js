document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  const productList = document.getElementById("productList");
  const filterSelect = document.getElementById("filterSelect");
  const isAvailableCheckbox = document.getElementById("isAvailable");
  const discountGroup = document.getElementById("discountGroup");
  const discountInput = document.getElementById("discount");
  const drawer = document.getElementById("drawer");
  const closeDrawer = document.getElementById("closeDrawer");
  const cartBtn = document.getElementById("cartBtn");
  const drawerContent = document.getElementById("drawerContent");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");

  let products = [];
  let cart = [];
  let editIndex = -1;

  const saved = localStorage.getItem("products");
  if (saved) {
    try {
      products = JSON.parse(saved);
    } catch (e) {
      console.error("localStorage JSON parse error:", e);
      products = [];
    }
  }

  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
      updateCart();
      updateCartTotal();
      updateCartCount();
    } catch (e) {
      console.error("localStorage cart parse error:", e);
      cart = [];
    }
  }

  renderProductList(products);

  cartBtn.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });

  closeDrawer.addEventListener("click", () => {
    drawer.classList.remove("open");
  });

  function updateDiscountVisibility() {
    if (isAvailableCheckbox.checked) {
      discountGroup.classList.add("show");
    } else {
      discountGroup.classList.remove("show");
      discountInput.value = "";
    }
  }

  updateDiscountVisibility();
  isAvailableCheckbox.addEventListener("change", updateDiscountVisibility);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.productName.value.trim();
    const imageUrl = form.imageUrl.value.trim();
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value, 10);
    const hasDiscount = isAvailableCheckbox.checked;
    const discountPercent = parseFloat(discountInput.value) || 0;

    let discountToShow = 0;
    if (hasDiscount && discountPercent > 0) {
      discountToShow = discountPercent;
    }

    const discountPrice =
      hasDiscount && discountPercent > 0
        ? price * (1 - discountPercent / 100)
        : price;

    const product = {
      name,
      imageUrl,
      price,
      quantity,
      discount: discountToShow.toFixed(1),
      discountPrice: discountPrice.toFixed(2),
    };

    if (editIndex === -1) {
      products.push(product);
    } else {
      products[editIndex] = product;
      editIndex = -1;
      document.querySelector(".btn-submit").textContent = "Mahsulot Qo'shish";
    }

    saveProducts();
    renderProductList(products);

    form.reset();
    updateDiscountVisibility();
  });

  filterSelect.addEventListener("change", () => {
    const val = filterSelect.value;
    let sorted = [...products];

    if (val === "az") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (val === "za") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (val === "priceHigh") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (val === "priceLow") {
      sorted.sort((a, b) => a.price - b.price);
    }

    renderProductList(sorted);
  });

  function renderProductList(list) {
    productList.innerHTML = "";

    if (list.length === 0) {
      productList.innerHTML = `
                        <div class="empty-message">
                            <i class="fas fa-box-open"></i>
                            Hozircha mahsulotlar mavjud emas
                        </div>`;
      return;
    }

    list.forEach((product, index) => {
      const isInCart = cart.some((item) => item.name === product.name);
      const productItem = document.createElement("div");
      productItem.className = "product-item";
      productItem.innerHTML = `
                        <img src="${product.imageUrl}" alt="${
        product.name
      }" onerror="this.src='https://via.placeholder.com/80x80?text=Rasm+Yo\\'q'">
                        <div class="product-info">
                            <div class="product-name">
                                <i class="fas fa-cube"></i>
                                ${product.name}
                            </div>
                            <div class="product-details">
                                <span class="product-price">
                                    <i class="fas fa-dollar-sign"></i>
                                    Asl narx: $${product.price}
                                </span>
                                <span class="product-discount-price">
                                    <i class="fas fa-tag"></i>
                                    Skidka narxi: $${product.discountPrice}
                                </span>
                                <span class="product-quantity">
                                    <i class="fas fa-percentage"></i>
                                    ${product.discount}% skidka
                                </span>
                                <span class="product-discount">
                                    <i class="fas fa-box"></i>
                                    ${product.quantity} dona
                                </span>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="btn-buy" data-index="${index}" ${
        isInCart ? 'style="display: none;"' : ""
      }>
                                <i class="fas fa-cart-plus"></i> Sotib olish
                            </button>
                            <button class="btn-edit" data-index="${index}">
                                <i class="fas fa-edit"></i> Tahrirlash
                            </button>
                            <button class="btn-delete" data-index="${index}">
                                <i class="fas fa-trash"></i> O'chirish
                            </button>
                        </div>
                    `;
      productList.appendChild(productItem);
    });

    const buyButtons = productList.querySelectorAll(".btn-buy");
    buyButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        buyProduct(idx);
      });
    });

    const editButtons = productList.querySelectorAll(".btn-edit");
    editButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        editProduct(idx);
      });
    });

    const deleteButtons = productList.querySelectorAll(".btn-delete");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        deleteProduct(idx);
      });
    });
  }

  function buyProduct(index) {
    const product = products[index];

    cart.push({
      ...product,
      id: Date.now() + Math.random(),
    });

    saveCart();
    updateCart();
    updateCartTotal();
    updateCartCount();

    const buyButton = document.querySelector(`.btn-buy[data-index="${index}"]`);
    if (buyButton) {
      buyButton.style.display = "none";
    }

    drawer.classList.add("open");
  }

  function updateCart() {
    drawerContent.innerHTML = "";

    if (cart.length === 0) {
      drawerContent.innerHTML = `
                        <div class="empty-message">
                            <i class="fas fa-shopping-cart"></i>
                            Savat bo'sh
                        </div>`;
      return;
    }

    cart.forEach((item, index) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
                        <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/50x50?text=Rasm+Yo\\'q'">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">
                                <i class="fas fa-dollar-sign"></i>
                                $${item.discountPrice}
                            </div>
                        </div>
                        <button class="btn-delete" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
      drawerContent.appendChild(cartItem);
    });
  }

  window.removeFromCart = function (index) {
    const removedProduct = cart[index];
    cart.splice(index, 1);
    saveCart();
    updateCart();
    updateCartTotal();
    updateCartCount();

    const productIndex = products.findIndex(
      (p) => p.name === removedProduct.name
    );
    if (productIndex !== -1) {
      const buyButton = document.querySelector(
        `.btn-buy[data-index="${productIndex}"]`
      );
      if (buyButton) {
        buyButton.style.display = "flex";
      }
    }
  };

  function updateCartTotal() {
    const total = cart.reduce(
      (sum, item) => sum + parseFloat(item.discountPrice),
      0
    );
    cartTotal.innerHTML = `
                    <i class="fas fa-calculator"></i>
                    Jami: $${total.toFixed(2)}
                `;
  }

  function updateCartCount() {
    cartCount.textContent = cart.length;
  }

  function saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("localStorage cart setItem error:", e);
    }
  }

  function editProduct(index) {
    const product = products[index];
    form.productName.value = product.name;
    form.imageUrl.value = product.imageUrl;
    form.price.value = product.price;
    form.quantity.value = product.quantity;

    if (parseFloat(product.discount) > 0) {
      isAvailableCheckbox.checked = true;
      discountInput.value = product.discount;
    } else {
      isAvailableCheckbox.checked = false;
      discountInput.value = "";
    }

    updateDiscountVisibility();

    editIndex = index;
    document.querySelector(".btn-submit").textContent = "Mahsulotni Yangilash";

    form.scrollIntoView({ behavior: "smooth" });
  }

  function deleteProduct(index) {
    if (confirm("Haqiqatan ham bu mahsulotni o'chirmoqchimisiz?")) {
      const deletedProduct = products[index];
      products.splice(index, 1);
      saveProducts();
      renderProductList(products);

      const cartIndex = cart.findIndex(
        (item) => item.name === deletedProduct.name
      );
      if (cartIndex !== -1) {
        cart.splice(cartIndex, 1);
        saveCart();
        updateCart();
        updateCartTotal();
        updateCartCount();
      }

      if (editIndex === index) {
        editIndex = -1;
        form.reset();
        document.querySelector(".btn-submit").textContent = "Mahsulot Qo'shish";
      }
    }
  }

  function saveProducts() {
    try {
      localStorage.setItem("products", JSON.stringify(products));
    } catch (e) {
      console.error("localStorage setItem error:", e);
    }
  }
});
