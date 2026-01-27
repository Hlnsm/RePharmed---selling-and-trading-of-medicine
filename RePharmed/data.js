// Dados mock (partilhados)
window.PS = window.PS || {};

PS.listings = [
  { id:"PS-001", name:"Paracetamol 500mg (20 comp.)", category:"analgesicos", activeSubstance:"paracetamol", lab:"Genéricos Lx", price:2.90, discountPct:45, expiresInDays:12, distanceKm:3.2, seller:"Farmácia Luz", city:"Lisboa", stock:18,image:"images/paracetamol.jpg"},
  { id:"PS-002", name:"Amoxicilina 500mg (16 cáps.)", category:"antibioticos", activeSubstance:"amoxicilina", lab:"BioPharma", price:6.50, discountPct:35, expiresInDays:8, distanceKm:7.4, seller:"Farmácia do Parque", city:"Oeiras", stock:6,image:"images/amoxicilina.jpg" },
  { id:"PS-003", name:"Vitamina C 1000mg (30 comp.)", category:"vitaminas", activeSubstance:"ácido ascórbico", lab:"VitaLabs", price:4.20, discountPct:50, expiresInDays:40, distanceKm:2.1, seller:"Farmácia Central", city:"Lisboa", stock:22,image:"images/vitamina-c.jpg" },
  { id:"PS-004", name:"Ibuprofeno 400mg (20 comp.)", category:"analgesicos", activeSubstance:"ibuprofeno", lab:"NovaGen", price:3.80, discountPct:30, expiresInDays:5, distanceKm:1.4, seller:"Farmácia Oriente", city:"Lisboa", stock:10,image:"images/ibuprofeno.jpg" },
  { id:"PS-005", name:"Spray Nasal (15ml)", category:"gripe", activeSubstance:"solução salina", lab:"NasoCare", price:5.10, discountPct:40, expiresInDays:18, distanceKm:12.0, seller:"Farmácia Tejo", city:"Almada", stock:9,image:"images/spray-nasal.jpg" },
  { id:"PS-006", name:"Creme Hidratante Dermo (200ml)", category:"dermo", activeSubstance:"ureia", lab:"DermoPlus", price:7.90, discountPct:55, expiresInDays:25, distanceKm:6.1, seller:"Farmácia do Mar", city:"Cascais", stock:5,image:"images/dermo-creme.jpg" },
  { id:"PS-007", name:"Antigripal (10 saquetas)", category:"gripe", activeSubstance:"paracetamol + outros", lab:"ColdAway", price:8.40, discountPct:60, expiresInDays:3, distanceKm:4.8, seller:"Farmácia Saldanha", city:"Lisboa", stock:7,image:"images/antigripal.jpg"},
  { id:"PS-008", name:"Probiótico (14 cáps.)", category:"vitaminas", activeSubstance:"lactobacillus", lab:"GutCare", price:9.20, discountPct:35, expiresInDays:60, distanceKm:9.9, seller:"Farmácia Colinas", city:"Amadora", stock:12 ,image:"images/probiotico.jpg"}
];

// Pedidos persistidos em localStorage (simples)
PS.loadOrders = function() {
  try { return JSON.parse(localStorage.getItem("ps_orders") || "[]"); }
  catch { return []; }
};
PS.saveOrders = function(orders) {
  localStorage.setItem("ps_orders", JSON.stringify(orders));
};
window.PS = window.PS || {};

// Pedidos (WANTED)
PS.loadRequests = function() {
  try { return JSON.parse(localStorage.getItem("ps_requests") || "[]"); }
  catch { return []; }
};
PS.saveRequests = function(reqs) {
  localStorage.setItem("ps_requests", JSON.stringify(reqs));
};

// Respostas a pedidos
PS.loadResponses = function() {
  try { return JSON.parse(localStorage.getItem("ps_responses") || "[]"); }
  catch { return []; }
};
PS.saveResponses = function(resps) {
  localStorage.setItem("ps_responses", JSON.stringify(resps));
};
PS.loadReceipts = function() {
  try { return JSON.parse(localStorage.getItem("ps_receipts") || "[]"); }
  catch { return []; }
};
PS.saveReceipts = function(items) {
  localStorage.setItem("ps_receipts", JSON.stringify(items));
};


