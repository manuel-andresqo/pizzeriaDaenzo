/* =========================================================
   UTILIDADES — cálculos de valoración, formato y redacción
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews = window.DaEnzoReviews || {};

  var STAR_PATH = 'M12 2.6l2.82 5.72 6.31.92-4.57 4.45 1.08 6.29L12 17.01l-5.64 2.97 1.08-6.29L2.87 9.24l6.31-.92L12 2.6z';

  var U = R.utils = {
    STAR_PATH: STAR_PATH,

    escape: function(s){
      return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
      });
    },

    /* ---- Cálculos ---- */
    count: function(list){ return list.length; },
    average: function(list){
      if (!list.length) return 0;
      var sum = list.reduce(function(a, r){ return a + r.rating; }, 0);
      return sum / list.length;
    },
    distribution: function(list){
      var d = { 1:0, 2:0, 3:0, 4:0, 5:0 };
      list.forEach(function(r){ d[r.rating]++; });
      return d;
    },
    /* 4.583 → "4,6" (redondeo a una cifra decimal, formato venezolano) */
    formatAverage: function(avg){
      return new Intl.NumberFormat('es-VE', { minimumFractionDigits:1, maximumFractionDigits:1 }).format(Math.round(avg * 10) / 10);
    },
    plural: function(n, one, many){ return n === 1 ? one : many; },

    /* '2026-09' → 'septiembre de 2026' */
    formatMonth: function(ym){
      if (!ym) return '';
      var p = ym.split('-');
      var d = new Date(Date.UTC(+p[0], (+p[1] || 1) - 1, 15));
      var t = new Intl.DateTimeFormat('es-VE', { month:'long', year:'numeric', timeZone:'UTC' }).format(d);
      return t.charAt(0).toUpperCase() + t.slice(1);
    },

    /* ---- Avatares ---- */
    initials: function(name){
      var parts = String(name).replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/);
      return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    },
    avatarHTML: function(review, cls){
      var c = 'rv-avatar' + (cls ? ' ' + cls : '');
      if (review.avatarUrl) return '<img class="' + c + '" src="' + U.escape(review.avatarUrl) + '" alt="" loading="lazy">';
      var tones = ['olive','terracotta','cream','sage','wood'];
      var h = 0; for (var i = 0; i < review.authorName.length; i++) h = (h * 31 + review.authorName.charCodeAt(i)) >>> 0;
      return '<span class="' + c + ' rv-avatar--' + tones[h % tones.length] + '" aria-hidden="true">' + U.escape(U.initials(review.authorName)) + '</span>';
    },

    /* ---- Estrellas estáticas (con relleno parcial para medias) ---- */
    starsHTML: function(value, label){
      var html = '<span class="rv-stars" role="img" aria-label="' + U.escape(label || (U.formatAverage(value).replace(',0','') + ' de 5 estrellas')) + '">';
      for (var i = 1; i <= 5; i++){
        var fill = Math.max(0, Math.min(1, value - (i - 1)));
        html += '<span class="rv-star"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>' +
                '<span class="rv-star-fill" style="width:' + Math.round(fill * 100) + '%"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg></span></span>';
      }
      return html + '</span>';
    },

    /* ---- Redacción a partir de frases rápidas (reglas locales, sin IA) ----
       ['masa','atencion'] → "La masa estaba deliciosa y la atención fue muy buena."
       Solo reformula lo que el usuario eligió: no añade hechos nuevos. */
    composeFromPhrases: function(selected){
      var desc = selected.filter(function(p){ return p.kind === 'desc'; }).map(function(p){ return p.clause; });
      var self = selected.filter(function(p){ return p.kind === 'self'; }).map(function(p){ return p.clause; });
      var out = [];
      if (desc.length) out.push(U.sentence(U.joinList(desc)));
      self.forEach(function(c){ out.push(U.sentence(c)); });
      return out.join(' ');
    },
    joinList: function(items){
      if (items.length <= 1) return items.join('');
      return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
    },
    sentence: function(s){ s = s.trim(); return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? '' : '.'); },

    formatBytes: function(b){ return b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB'; },

    /* Iconos compartidos */
    icon: {
      camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
      close:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12"/></svg>',
      arrow:'<svg viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      info:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.3"/><path d="M8 7.2v4M8 4.9v.1"/></svg>'
    }
  };
})();
