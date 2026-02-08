  // Dados mock (partilhados)
  window.PS = window.PS || {};

  PS.listings = [
    { id:"PS-001", name:"Paracetamol 500mg (20 comp.)", category:"analgesicos", activeSubstance:"paracetamol", lab:"Genéricos Lx", price:2.90, discountPct:45, expiresInDays:10, distanceKm:3.2, seller:"Farmácia Luz", city:"Lisboa", stock:18,image:"images/paracetamol.jpg"},
    { id:"PS-002", name:"Amoxicilina 500mg (16 cáps.)", category:"antibioticos", activeSubstance:"amoxicilina", lab:"BioPharma", price:6.50, discountPct:35, expiresInDays:8, distanceKm:7.4, seller:"Farmácia do Parque", city:"Oeiras", stock:6,image:"images/amoxicilina.jpg" },
    { id:"PS-003", name:"Vitamina C 1000mg (30 comp.)", category:"vitaminas", activeSubstance:"ácido ascórbico", lab:"VitaLabs", price:4.20, discountPct:50, expiresInDays:11, distanceKm:2.1, seller:"Farmácia Central", city:"Lisboa", stock:22,image:"images/vitamina-c.jpg" },
    { id:"PS-004", name:"Ibuprofeno 400mg (20 comp.)", category:"analgesicos", activeSubstance:"ibuprofeno", lab:"NovaGen", price:3.80, discountPct:30, expiresInDays:5, distanceKm:1.4, seller:"Farmácia Oriente", city:"Lisboa", stock:10,image:"images/ibuprofeno.jpg" },
    { id:"PS-005", name:"Spray Nasal (15ml)", category:"gripe", activeSubstance:"solução salina", lab:"NasoCare", price:5.10, discountPct:40, expiresInDays:1, distanceKm:12.0, seller:"Farmácia Tejo", city:"Almada", stock:9,image:"images/spray-nasal.jpg" },
    { id:"PS-006", name:"Creme Hidratante Dermo (200ml)", category:"dermo", activeSubstance:"ureia", lab:"DermoPlus", price:7.90, discountPct:55, expiresInDays:11, distanceKm:6.1, seller:"Farmácia do Mar", city:"Cascais", stock:5,image:"images/dermo-creme.jpg" },
    { id:"PS-007", name:"Antigripal (10 saquetas)", category:"gripe", activeSubstance:"paracetamol + outros", lab:"ColdAway", price:8.40, discountPct:60, expiresInDays:3, distanceKm:4.8, seller:"Farmácia Saldanha", city:"Lisboa", stock:7,image:"images/antigripal.jpg"},
    { id:"PS-008", name:"Probiótico (14 cáps.)", category:"vitaminas", activeSubstance:"lactobacillus", lab:"GutCare", price:9.20, discountPct:35, expiresInDays:2, distanceKm:9.9, seller:"Farmácia Colinas", city:"Amadora", stock:12 ,image:"images/probiotico.jpg"}
      ,
    { id:"PS-009",  name:"Omeprazol 20mg (28 cáps.)", category:"outros", activeSubstance:"omeprazol", lab:"GastroCare", price:7.20, discountPct:35, expiresInDays:2, distanceKm:5.6, seller:"Farmácia Alameda", city:"Lisboa", stock:14, image:"images/probiotico.jpg" },
    { id:"PS-010",  name:"Cetirizina 10mg (20 comp.)", category:"outros", activeSubstance:"cetirizina", lab:"AllerFree", price:4.60, discountPct:40, expiresInDays:10, distanceKm:8.1, seller:"Farmácia Norte", city:"Loures", stock:16, image:"images/vitamina-c.jpg" },
    { id:"PS-011",  name:"Loratadina 10mg (20 comp.)", category:"outros", activeSubstance:"loratadina", lab:"AllerFree", price:4.40, discountPct:30, expiresInDays:7, distanceKm:10.4, seller:"Farmácia Colinas", city:"Amadora", stock:20, image:"images/vitamina-c.jpg" },

    { id:"PS-012",  name:"Aspirina 500mg (20 comp.)", category:"analgesicos", activeSubstance:"ácido acetilsalicílico", lab:"NovaGen", price:3.10, discountPct:6, expiresInDays:9, distanceKm:2.8, seller:"Farmácia Saldanha", city:"Lisboa", stock:24, image:"images/paracetamol.jpg" },
    { id:"PS-013",  name:"Diclofenac Gel (100g)", category:"analgesicos", activeSubstance:"diclofenac", lab:"PainRelief", price:6.90, discountPct:35, expiresInDays:8, distanceKm:6.9, seller:"Farmácia do Mar", city:"Cascais", stock:9, image:"images/ibuprofeno.jpg" },
    { id:"PS-014",  name:"Naproxeno 250mg (20 comp.)", category:"analgesicos", activeSubstance:"naproxeno", lab:"NovaGen", price:5.20, discountPct:25, expiresInDays:11, distanceKm:9.0, seller:"Farmácia do Parque", city:"Oeiras", stock:11, image:"images/ibuprofeno.jpg" },

    { id:"PS-015",  name:"Azitromicina 500mg (3 comp.)", category:"antibioticos", activeSubstance:"azitromicina", lab:"BioPharma", price:9.80, discountPct:30, expiresInDays:9, distanceKm:13.2, seller:"Farmácia Tejo", city:"Almada", stock:6, image:"images/amoxicilina.jpg" },
    { id:"PS-016",  name:"Claritromicina 500mg (14 comp.)", category:"antibioticos", activeSubstance:"claritromicina", lab:"BioPharma", price:12.40, discountPct:40, expiresInDays:10, distanceKm:7.7, seller:"Farmácia Luz", city:"Lisboa", stock:4, image:"images/amoxicilina.jpg" },
    { id:"PS-017",  name:"Ciprofloxacina 500mg (10 comp.)", category:"antibioticos", activeSubstance:"ciprofloxacina", lab:"Genéricos Lx", price:10.90, discountPct:35, expiresInDays:3, distanceKm:11.4, seller:"Farmácia Central", city:"Lisboa", stock:8, image:"images/amoxicilina.jpg" },

    { id:"PS-018",  name:"Soro Fisiológico (500ml)", category:"gripe", activeSubstance:"cloreto de sódio 0,9%", lab:"NasoCare", price:2.30, discountPct:20, expiresInDays:4, distanceKm:4.1, seller:"Farmácia Oriente", city:"Lisboa", stock:30, image:"images/spray-nasal.jpg" },
    { id:"PS-019",  name:"Pastilhas Garganta (24 un.)", category:"gripe", activeSubstance:"amylmetacresol + outros", lab:"ColdAway", price:4.10, discountPct:50, expiresInDays:7, distanceKm:3.9, seller:"Farmácia Saldanha", city:"Lisboa", stock:18, image:"images/antigripal.jpg" },
    { id:"PS-020",  name:"Xarope Tosse (200ml)", category:"gripe", activeSubstance:"dextrometorfano", lab:"ColdAway", price:7.30, discountPct:45, expiresInDays:14, distanceKm:12.6, seller:"Farmácia Tejo", city:"Almada", stock:10, image:"images/antigripal.jpg" },

    { id:"PS-021",  name:"Creme Barreira (100ml)", category:"dermo", activeSubstance:"óxido de zinco", lab:"DermoPlus", price:6.40, discountPct:40, expiresInDays:5, distanceKm:6.3, seller:"Farmácia do Mar", city:"Cascais", stock:7, image:"images/dermo-creme.jpg" },
    { id:"PS-022",  name:"Gel Hidratante (200ml)", category:"dermo", activeSubstance:"ureia + glicerina", lab:"DermoPlus", price:5.90, discountPct:35, expiresInDays:6, distanceKm:8.8, seller:"Farmácia Colinas", city:"Amadora", stock:12, image:"images/dermo-creme.jpg" },
    { id:"PS-023",  name:"Bálsamo Reparador (50ml)", category:"dermo", activeSubstance:"pantenol", lab:"DermoPlus", price:7.90, discountPct:55, expiresInDays:3, distanceKm:2.9, seller:"Farmácia Central", city:"Lisboa", stock:9, image:"images/dermo-creme.jpg" },

    { id:"PS-024",  name:"Vitamina D3 2000UI (60 caps.)", category:"vitaminas", activeSubstance:"colecalciferol", lab:"VitaLabs", price:8.90, discountPct:45, expiresInDays:9, distanceKm:9.7, seller:"Farmácia do Parque", city:"Oeiras", stock:15, image:"images/vitamina-c.jpg" },
    { id:"PS-025",  name:"Magnésio (30 comp.)", category:"vitaminas", activeSubstance:"magnésio", lab:"VitaLabs", price:6.70, discountPct:35, expiresInDays:9, distanceKm:5.2, seller:"Farmácia Luz", city:"Lisboa", stock:20, image:"images/probiotico.jpg" },
    { id:"PS-026",  name:"Zinco + Vitamina C (30 comp.)", category:"vitaminas", activeSubstance:"zinco + ácido ascórbico", lab:"VitaLabs", price:7.40, discountPct:50, expiresInDays:10, distanceKm:7.0, seller:"Farmácia Oriente", city:"Lisboa", stock:13, image:"images/vitamina-c.jpg" },

    { id:"PS-027",  name:"Metformina 850mg (60 comp.)", category:"outros", activeSubstance:"metformina", lab:"Genéricos Lx", price:9.60, discountPct:30, expiresInDays:2, distanceKm:14.1, seller:"Farmácia Norte", city:"Loures", stock:10, image:"images/probiotico.jpg" },
    { id:"PS-028",  name:"Amlodipina 5mg (30 comp.)", category:"outros", activeSubstance:"amlodipina", lab:"CardioLab", price:5.80, discountPct:35, expiresInDays:2, distanceKm:10.2, seller:"Farmácia Tejo", city:"Almada", stock:12, image:"images/paracetamol.jpg" },
    { id:"PS-029",  name:"Losartan 50mg (30 comp.)", category:"outros", activeSubstance:"losartan", lab:"CardioLab", price:6.20, discountPct:40, expiresInDays:6, distanceKm:6.6, seller:"Farmácia Alameda", city:"Lisboa", stock:18, image:"images/paracetamol.jpg" },
    { id:"PS-030",  name:"Loperamida 2mg (12 cáps.)", category:"outros", activeSubstance:"loperamida", lab:"GastroCare", price:3.90, discountPct:45, expiresInDays:7, distanceKm:4.9, seller:"Farmácia Oriente", city:"Lisboa", stock:22, image:"images/probiotico.jpg" }

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
  PS.genPickupCode = function() {
    // Ex: PUP-7K2J-94QX
    const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PUP-${part()}-${part()}`;
  };

  PS.loadReceipts = PS.loadReceipts || function() {
    try { return JSON.parse(localStorage.getItem("ps_receipts") || "[]"); }
    catch { return []; }
  };
  PS.saveReceipts = PS.saveReceipts || function(items) {
    localStorage.setItem("ps_receipts", JSON.stringify(items));
  };


