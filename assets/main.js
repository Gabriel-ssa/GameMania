(function () {
    'use strict';

    
    function parsePriceStr(text) {
        if (!text) return 0;
        const cleaned = String(text).replace(/[^0-9\.,-]/g, '').replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(cleaned) || 0;
    }
    function formatPrice(num) {
        return Number(num || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    
    function getCart() {
        try { return JSON.parse(localStorage.getItem('gm_cart') || '[]'); }
        catch (e) { return []; }
    }
    function saveCart(cart) {
        localStorage.setItem('gm_cart', JSON.stringify(cart));
    }

    
     function ensureToast() {
        if (document.getElementById('gm-toast-style')) return;
        const css = `
            #gm-toast-overlay { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; z-index: 2050; margin-left: 650px}
            
            /* centralizado; 5px de distância entre borda e primeira/última letra (padding horizontal = 5px) */
            #gm-toast { position: relative; background: rgba(0,0,0,0.92); color: #fff; padding: .75rem 5px; border-radius: .5rem; max-width: 90%; width: auto; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.4); font-weight: 600; display: inline-block; }
        `;
        const s = document.createElement('style');
        s.id = 'gm-toast-style';
        s.textContent = css;
        document.head.appendChild(s);

        const overlay = document.createElement('div');
        overlay.id = 'gm-toast-overlay';
        overlay.innerHTML = '<div id="gm-toast-backdrop"></div><div id="gm-toast" role="status" aria-live="polite"></div>';
        document.body.appendChild(overlay);

        
        overlay.querySelector('#gm-toast-backdrop').addEventListener('click', () => {
            hideToastImmediate();
        });
    }

    function hideToastImmediate() {
        const $ov = $('#gm-toast-overlay');
        if ($ov.length) {
            $ov.stop(true,true).fadeOut(100);
            clearTimeout($ov.data('tm'));
            $ov.removeData('tm');
        }
    }

    function showToast(message, duration = 3000) {
        ensureToast();
        const $ov = $('#gm-toast-overlay');
        const $box = $('#gm-toast');
        $box.text(message);
        $ov.stop(true, true).fadeIn(200);
        clearTimeout($ov.data('tm'));
        const tm = setTimeout(() => {
            $ov.fadeOut(100);
            $ov.removeData('tm');
        }, duration);
        $ov.data('tm', tm);
    }


    $(document).on('click', '.add-to-cart', function (e) {
        e.preventDefault();
        const $btn = $(this);
        const $prod = $btn.closest('.product-item');
        if (!$prod.length) return;

        const title = ($prod.find('.product-title').text() || '').trim();
        const priceText = ($prod.find('.product-price').text() || '').trim();
        const price = parsePriceStr(priceText);
        const img = $prod.find('img').attr('src') || '';
        const id = $prod.data('id') || title.replace(/\s+/g, '-').toLowerCase();

        const cart = getCart();
        const existing = cart.find(it => it.id === id);
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            cart.push({ id, title, price, img, qty: 1 });
        }
        saveCart(cart);
        showToast('Produto adicionado ao carrinho');
        if ($('#cart-items').length) renderCart();
    });

    
    function renderCart() {
        const $container = $('#cart-items');
        if (!$container.length) return;

        const cart = getCart();
        $container.empty();

        if (!cart || cart.length === 0) {
            $('#empty-cart-message').removeClass('d-none');
            $('#subtotal-value').text(formatPrice(0));
            $('#total-value').text(formatPrice(0));
        
            showToast('Seu carrinho está vazio');
            return;
        }
        $('#empty-cart-message').addClass('d-none');

        cart.forEach(item => {
            const lineTotal = item.price * item.qty;
            const $art = $(` 
                <article class="cart-item card mb-3" data-id="${item.id}">
                  <div class="card-body">
                    <div class="d-flex justify-content-between">
                      <div class="d-flex align-items-center">
                        <figure class="me-3 mb-0"><img src="${item.img}" alt="${item.title}" class="img-fluid rounded-3" style="width:65px"></figure>
                        <div>
                          <h3 class="h6 mb-1">${item.title}</h3>
                          <div class="text-muted small">Preço unit.: ${formatPrice(item.price)}</div>
                        </div>
                      </div>

                      <div class="d-flex align-items-center">
                        <div class="d-flex align-items-center" style="width:140px">
                          <button class="btn btn-outline-secondary btn-sm btn-minus px-2">-</button>
                          <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm text-center qty-input mx-2" style="width:60px">
                          <button class="btn btn-outline-secondary btn-sm btn-plus px-2">+</button>
                        </div>

                        <div style="width:120px; text-align:right" class="ms-3">
                          <p class="mb-0 fw-bold line-total">${formatPrice(lineTotal)}</p>
                        </div>

                        <a href="#" class="text-danger ms-3 remove-item small">Remover</a>
                      </div>
                    </div>
                  </div>
                </article>
            `);
            $container.append($art);
        });

        bindCartEvents();
        updateTotals();
    }

    
    function updateTotals() {
        const cart = getCart();
        const subtotal = cart.reduce((acc, it) => acc + (it.price * (it.qty || 0)), 0);
        $('#subtotal-value').text(formatPrice(subtotal));
        $('#total-value').text(formatPrice(subtotal));
    }

    
    function bindCartEvents() {
        
        $('.remove-item').off('click').on('click', function (e) {
            e.preventDefault();
            const id = $(this).closest('.cart-item').data('id');
            let cart = getCart().filter(it => it.id !== id);
            saveCart(cart);
            renderCart();
            showToast('Item removido do carrinho');
        });

        
        $('.qty-input').off('change').on('change', function () {
            let qty = parseInt($(this).val(), 10) || 1;
            if (qty < 1) qty = 1;
            $(this).val(qty);
            const id = $(this).closest('.cart-item').data('id');
            const cart = getCart().map(it => { if (it.id === id) it.qty = qty; return it; });
            saveCart(cart);
            const item = cart.find(it => it.id === id);
            if (item) $(this).closest('.cart-item').find('.line-total').text(formatPrice(item.price * item.qty));
            updateTotals();
        });

        
        $('.btn-plus').off('click').on('click', function () {
            const $input = $(this).siblings('.qty-input');
            $input.val((parseInt($input.val(), 10) || 0) + 1).trigger('change');
        });
        $('.btn-minus').off('click').on('click', function () {
            const $input = $(this).siblings('.qty-input');
            let cur = parseInt($input.val(), 10) || 1;
            if (cur > 1) $input.val(cur - 1).trigger('change');
        });
    }

    
    $(document).on('click', '#checkout-button', function (e) {
        e.preventDefault();
        const cart = getCart();
        if (!cart || cart.length === 0) {
            showToast('Seu carrinho está vazio.');
            return;
        }
        showToast('Obrigado pela compra! Volte sempre.');
    });

    
    $(function () {
        ensureToast();
        renderCart(); 
    });

    function initProductSearch() {
    const input = document.querySelector('.search-input');
    const list = document.querySelector('.product-list');
    if (!input || !list) return;

    
    const items = Array.from(list.querySelectorAll('.product-item'));

    
    function applyGrid(count) {
        const cols = Math.min(5, Math.max(1, count));
        list.style.display = 'grid';
        list.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        list.style.gap = '1rem';
    }
    function resetGrid() {
        list.style.display = '';
        list.style.gridTemplateColumns = '';
        list.style.gap = '';
    }

    function runFilter() {
        const term = input.value.trim().toLowerCase();
        if (!term) {
            items.forEach(it => it.style.display = '');
            resetGrid();
            return;
        }
        const matches = items.filter(it => {
            const title = (it.querySelector('.product-title')?.textContent || '').toLowerCase();
            return title.includes(term);
        });

        items.forEach(it => it.style.display = matches.includes(it) ? '' : 'none');
        applyGrid(matches.length || 1);
    }

    
    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(runFilter, 120);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            runFilter();
        }
    });
}

$(function () {
    ensureToast();
    initProductSearch();
    renderCart(); 
});

function initProductSearch() {
    const input = document.querySelector('.search-input');
    const list = document.querySelector('.product-list');
    if (!input || !list) return;

    
    const items = Array.from(list.querySelectorAll('.product-item'));

    
    function applyGrid(count) {
        const cols = Math.min(5, Math.max(1, count));
        list.style.display = 'grid';
        list.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        list.style.gap = '1rem';
    }
    function resetGrid() {
        list.style.display = '';
        list.style.gridTemplateColumns = '';
        list.style.gap = '';
    }

    function runFilter() {
        const term = input.value.trim().toLowerCase();
        if (!term) {
            items.forEach(it => it.style.display = '');
            resetGrid();
            return;
        }
        const matches = items.filter(it => {
            const title = (it.querySelector('.product-title')?.textContent || '').toLowerCase();
            return title.includes(term);
        });

        items.forEach(it => it.style.display = matches.includes(it) ? '' : 'none');
        applyGrid(matches.length || 1);
    }

    
    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(runFilter, 120);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            runFilter();
        }
    });
}

$(function () {
    ensureToast();
    initProductSearch();
    renderCart(); 
});


function validateEmail(email) {
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim());
}

function validatePassword(password) {
    
    return password && password.length >= 4;
}


$(document).on('submit', 'form', function (e) {
    const $form = $(this);
    const formId = $form.attr('id') || '';

        if (formId.includes('login') || $form.find('#username').length) {
        e.preventDefault();
        const username = $form.find('#username').val().trim();
        const password = $form.find('#password').val().trim();

        if (!username) {
            showToast('Por favor, preencha o nome de usuário ou e-mail.');
            return;
        }
        if (!validatePassword(password)) {
            showToast('A senha deve ter no mínimo 4 caracteres.');
            return;
        }

        showToast('Login realizado com sucesso!');
        
    }

    
    else if (formId.includes('cadastro') || $form.find('#email').length) {
        e.preventDefault();
        const name = $form.find('#name').val().trim();
        const email = $form.find('#email').val().trim();
        const password = $form.find('#password').val().trim();
        const confirmPassword = $form.find('#confirm-password').val().trim();

        if (!name) {
            showToast('Por favor, preencha o nome.');
            return;
        }
        if (!validateEmail(email)) {
            showToast('Por favor, insira um e-mail válido.');
            return;
        }
        if (!validatePassword(password)) {
            showToast('A senha deve ter no mínimo 4 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            showToast('As senhas não correspondem.');
            return;
        }

        showToast('Cadastro realizado com sucesso!');
        
    }
});


})();   