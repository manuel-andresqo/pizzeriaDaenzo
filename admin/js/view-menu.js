/* =========================================================
   MÓDULO 5 · MENÚ Y PRODUCTOS
   Mismo catálogo que la web (js/order/menu-data.js). Precio,
   descripción y disponibilidad se editan aquí y se guardan en la
   capa de datos de demostración: la web abierta EN ESTE NAVEGADOR
   los aplica al instante (con backend se guardarán en la base de datos).
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, M = window.DAENZO_MENU, I = PV.icon, esc = PV.esc;
  var S = { cat:'todas', q:'', off:false }, root = null;

  function products(d){
    return M.products.map(function(p){ return PV.product(p.id, d); }).filter(function(p){
      if (S.cat !== 'todas' && p.category !== S.cat) return false;
      if (S.off && p.available) return false;
      var q = S.q.trim().toLowerCase(); return !q || (p.name + ' ' + (p.short || '') + ' ' + PV.category(p.category).label).toLowerCase().indexOf(q) >= 0;
    });
  }
  function card(p){
    var img = p.img ? '<img src="' + esc(PV.asset(p.img.src)) + '" alt="" loading="lazy" style="object-position:' + esc(p.img.pos || '50% 50%') + '">' : '<span class="pm-ph">' + I('cubiertos') + '</span>';
    return '<article class="pm' + (p.available ? '' : ' is-off') + '" data-id="' + p.id + '">' +
      '<div class="pm-img">' + img + (p.available ? '' : '<span class="pm-off">No disponible</span>') + '</div>' +
      '<div class="pm-b"><p class="pm-cat">' + esc(PV.category(p.category).label) + (p.edited ? ' <span class="tag tag--edit">Editado</span>' : '') + '</p>' +
        '<h3>' + esc(p.name) + '</h3><p class="pm-d">' + esc(p.short || '') + '</p>' +
        '<div class="pm-f"><span class="pm-price">' + (p.variants.length > 1 ? '<small>desde</small> ' : '') + PV.money(p.price) + (p.price !== p.origPrice ? ' <s>' + PV.money(p.origPrice) + '</s>' : '') + '</span>' +
          '<label class="sw" title="Disponible en la web"><input type="checkbox" data-av="' + p.id + '"' + (p.available ? ' checked' : '') + '><i aria-hidden="true"></i><span class="sr-only">Disponible: ' + esc(p.name) + '</span></label></div>' +
        '<button type="button" class="btn btn--sm btn--ghost pm-edit" data-edit="' + p.id + '">' + I('edit') + 'Editar</button></div></article>';
  }
  function paint(d){
    if (!root) return;
    var all = M.products.map(function(p){ return PV.product(p.id, d); });
    PV.$$('[data-cat]', root).forEach(function(b){ var n = b.dataset.cat === 'todas' ? all.length : all.filter(function(p){ return p.category === b.dataset.cat; }).length; b.setAttribute('aria-pressed', String(b.dataset.cat === S.cat)); b.querySelector('em').textContent = n; });
    var off = all.filter(function(p){ return !p.available; }).length, ed = all.filter(function(p){ return p.edited; }).length;
    root.querySelector('[data-offf]').setAttribute('aria-pressed', String(S.off));
    root.querySelector('[data-offf] em').textContent = off;
    root.querySelector('.mn-sum').innerHTML = all.length + ' productos · ' + off + ' no disponibles · ' + ed + ' con cambios' + (ed ? ' · <button type="button" class="link" data-resetall>Restablecer todo el catálogo</button>' : '');
    var ps = products(d);
    root.querySelector('.mn-grid').innerHTML = ps.length ? ps.map(card).join('') : '<div class="empty empty--sm">' + I('search') + '<h2>Sin resultados</h2><p>Prueba con otra búsqueda o categoría.</p></div>';
  }
  function edit(id){
    var p = PV.product(id);
    PV.modal.open({
      title: 'Editar ' + p.name, wide:true,
      body: '<div class="ed"><div class="ed-img">' + (p.img ? '<img src="' + esc(PV.asset(p.img.src)) + '" alt="">' : '') + '</div><div class="ed-f">' +
        '<label class="lbl" for="edPrice">Precio ' + (p.variants.length > 1 ? 'base (tamaño o versión más económica)' : '') + ' · USD</label>' +
        '<div class="money-in"><span>$</span><input id="edPrice" class="field" inputmode="decimal" value="' + (p.price / 100).toFixed(2).replace('.', ',') + '"></div>' +
        '<p class="hint">Original: ' + PV.money(p.origPrice) + (p.variants.length > 1 ? '. Las diferencias de tamaño se mantienen.' : '') + '</p>' +
        '<label class="lbl" for="edDesc">Descripción breve</label><textarea id="edDesc" class="field" rows="3" maxlength="160">' + esc(p.short || '') + '</textarea>' +
        '<label class="sw sw--row"><input type="checkbox" id="edAv"' + (p.available ? ' checked' : '') + '><i aria-hidden="true"></i><span>Disponible para pedir en la web</span></label>' +
        '<p class="ferr" id="edErr" aria-live="polite"></p>' +
        (p.edited ? '<button type="button" class="link" data-edreset>Volver a los valores originales</button>' : '') +
        '<p class="hint">Se guarda en la demo y la web de este navegador lo muestra al instante. En producción se guardará en la base de datos con permisos de administrador.</p></div></div>',
      actions: [{ label:'Cancelar', ghost:true }, { label:'Guardar cambios', run: function(m){
        var raw = PV.$('#edPrice', m).value.trim().replace(/\s/g, '').replace(',', '.');
        var v = /^\d+(\.\d{1,2})?$/.test(raw) ? Math.round(parseFloat(raw) * 100) : NaN;
        if (!(v > 0) || v > 100000){ PV.$('#edErr', m).textContent = 'Escribe un precio válido (por ejemplo 12,50).'; PV.$('#edPrice', m).focus(); return false; }
        var desc = PV.$('#edDesc', m).value.trim();
        if (!desc){ PV.$('#edErr', m).textContent = 'La descripción no puede quedar vacía.'; return false; }
        return DB.setOverride(id, { price: v === p.base.price ? undefined : v, short: desc === p.base.short ? undefined : desc, available: PV.$('#edAv', m).checked ? undefined : false })
          .then(function(){ PV.toast(p.name + ' · cambios guardados', { tone:'ready' }); });
      } }],
      mount: function(m){
        m.addEventListener('click', function(e){ if (e.target.closest('[data-edreset]')){ DB.setOverride(id, { price:undefined, short:undefined, available:undefined }).then(function(){ PV.toast(p.name + ' · valores originales', { tone:'info' }); m.querySelector('[data-mx]').click(); }); } });
        setTimeout(function(){ var f = PV.$('#edPrice', m); f.focus(); f.select(); }, 60);
      }
    });
  }

  PV.register('menu', {
    label:'Menú y productos', short:'Menú', icon:'menu', kicker: function(){ return 'Mismo catálogo que la web'; },
    mount: function(r){
      root = r;
      r.innerHTML = '<div class="mn-bar"><label class="search">' + I('search') + '<span class="sr-only">Buscar producto</span><input type="search" id="mnQ" placeholder="Buscar producto" autocomplete="off"></label>' +
        '<div class="chips" role="group" aria-label="Categoría"><button type="button" class="chip" data-cat="todas" aria-pressed="true">Todas <em>0</em></button>' + M.categories.map(function(c){ return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + ' <em>0</em></button>'; }).join('') +
        '<button type="button" class="chip chip--off" data-offf aria-pressed="false">No disponibles <em>0</em></button></div></div>' +
        '<p class="mn-sum hint"></p><div class="mn-grid"></div>';
      var q = r.querySelector('#mnQ'); q.addEventListener('input', function(){ S.q = q.value; paint(PV.data()); });
      r.addEventListener('change', function(e){
        var a = e.target.closest('[data-av]'); if (!a) return;
        var p = PV.product(a.dataset.av);
        DB.setOverride(p.id, { available: a.checked ? undefined : false }).then(function(){ PV.toast(p.name + (a.checked ? ' disponible otra vez en la web' : ' marcado como no disponible'), { tone: a.checked ? 'ready' : 'cooking', icon: a.checked ? 'check' : 'alert' }); });
      });
    },
    route: function(){ paint(PV.data()); },
    update: function(r, d){ paint(d); },
    click: function(e){
      var c = e.target.closest('[data-cat]'); if (c){ S.cat = c.dataset.cat; paint(PV.data()); return true; }
      if (e.target.closest('[data-offf]')){ S.off = !S.off; paint(PV.data()); return true; }
      var ed = e.target.closest('[data-edit]'); if (ed){ edit(ed.dataset.edit); return true; }
      if (e.target.closest('[data-resetall]')){ PV.modal.confirm({ title:'Restablecer el catálogo', text:'Todos los precios, descripciones y disponibilidades vuelven a los valores originales del menú.', ok:'Restablecer', danger:true }).then(function(ok){ if (ok) DB.resetOverrides().then(function(){ PV.toast('Catálogo restablecido', { tone:'info' }); }); }); return true; }
    },
    leave: function(){ root = null; }
  });
})();
