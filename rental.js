// Modal helpers
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Wire top-level buttons
document.getElementById('addProductBtn').addEventListener('click', () => openModal('addModal'));

// Close icons
document.querySelectorAll('.close-x').forEach(btn => {
  btn.addEventListener('click', (ev) => {
    const id = btn.dataset.close;
    if (id) closeModal(id);
    else { 
      btn.closest('.modal').style.display = 'none';
    }
  });
});


document.getElementById('editDiscard').addEventListener('click', () => closeModal('editModal'));
document.getElementById('returnDiscard').addEventListener('click', () => closeModal('returnModal'));
document.getElementById('addDiscard').addEventListener('click', () => closeModal('addModal'));


let activeCard = null;


function onEditClick(card) {
  activeCard = card;
  
  const customer = card.querySelector('.customer').textContent || '';
  const item = card.querySelector('.item-name').textContent || '';
  const size = card.querySelector('.size').textContent || '';
  const price = card.querySelector('.price').textContent || '';
  const rented = card.querySelector('.rented-date').textContent || '';
  const due = card.querySelector('.due-date').textContent || '';
  const statusBadge = card.querySelector('.status-badge').textContent || '';

  const form = document.getElementById('editForm');
  form.name.value = customer.replace(/\(|\)/g,'') || '';
  form.contact.value = '';
  form.item.value = item;
  form.rental_date.value = rented;
  form.return_date.value = due;
  
  Array.from(form.status.options).forEach(opt => {
    opt.selected = opt.textContent.trim() === statusBadge.trim();
  });

  openModal('editModal');
}


function onProcessClick(card) {
  activeCard = card;
  const cust = card.querySelector('.customer').textContent || '(Customer)';
  const item = card.querySelector('.item-name').textContent || '';
  const price = card.querySelector('.price').textContent || '';
  const statusBadge = card.querySelector('.status-badge').textContent || '';

  document.getElementById('ret-name').textContent = cust;
  document.getElementById('ret-contact').textContent = '';
  document.getElementById('ret-item').textContent = item;
  document.getElementById('ret-price').textContent = price;
  document.getElementById('ret-status').textContent = statusBadge;

  openModal('returnModal');
}


function attachCardListeners(root = document) {
  root.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => onEditClick(btn.closest('.rental-card'));
  });
  root.querySelectorAll('.process-btn').forEach(btn => {
    btn.onclick = () => onProcessClick(btn.closest('.rental-card'));
  });
}
attachCardListeners(document);


document.getElementById('editForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeCard) return closeModal('editModal');
  const form = e.target;

  activeCard.querySelector('.customer').textContent = '(' + (form.name.value || 'Customer') + ')';
  activeCard.querySelector('.item-name').textContent = form.item.value || 'Item';
  activeCard.querySelector('.size').textContent = form.rental_date.value || activeCard.querySelector('.size').textContent;
  activeCard.querySelector('.price').textContent = form.return_date.value || activeCard.querySelector('.price').textContent;
 
  const badge = activeCard.querySelector('.status-badge');
  const statusText = form.status.value || badge.textContent;
  badge.textContent = statusText;
  if (statusText.toLowerCase().includes('returned')) {
    badge.className = 'status-badge badge-green';
    activeCard.querySelector('.process-btn').textContent = 'Returned';
    activeCard.querySelector('.process-btn').disabled = true;
    activeCard.querySelector('.process-btn').classList.add('btn-disabled');
  } else if (statusText.toLowerCase().includes('due')) {
    badge.className = 'status-badge badge-red';
  } else {
    badge.className = 'status-badge';
  }
  closeModal('editModal');
});


document.getElementById('returnForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeCard) return closeModal('returnModal');


  const badge = activeCard.querySelector('.status-badge');
  badge.textContent = 'Returned';
  badge.className = 'status-badge badge-green';


  const processBtn = activeCard.querySelector('.process-btn');
  processBtn.textContent = 'Returned';
  processBtn.disabled = true;
  processBtn.classList.add('btn-disabled');

  closeModal('returnModal');
});


document.getElementById('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const name = f.product_name.value || 'New Item';
  const size = f.size.value || '-';
  const price = f.rental_price.value || '0';

  const container = document.getElementById('rentalList');

  const card = document.createElement('article');
  card.className = 'rental-card';
  card.dataset.status = 'active';
  card.innerHTML = `
    <div class="left">
      <div class="avatar"></div>
      <div class="rental-info">
        <p class="customer">(Customer #)</p>
        <p class="item-line">Item: <span class="item-name">${name}</span></p>
        <p class="detail-line">Size: <span class="size">${size}</span> &nbsp; Price: <span class="price">${price}</span></p>
        <p class="date-line">Date rented: <span class="rented-date">--</span> &nbsp; Due: <span class="due-date">--</span></p>
      </div>
    </div>
    <div class="right">
      <div class="actions">
        <button class="btn-gray edit-btn">Edit</button>
        <button class="btn-black process-btn">Process return</button>
      </div>
      <div class="status-badge badge-red">Active</div>
    </div>
  `;
  container.appendChild(card);


  attachCardListeners(card);
 
  f.reset();
  closeModal('addModal');
});


document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.rental-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
});
document.getElementById('statusFilter').addEventListener('change', (e) => {
  const val = e.target.value.toLowerCase();
  document.querySelectorAll('.rental-card').forEach(card => {
    if (val === 'all status' || val === 'all' || val === '') { card.style.display = ''; return; }
    const badge = card.querySelector('.status-badge').textContent.toLowerCase();
    card.style.display = badge.includes(val) ? '' : 'none';
  });
});
