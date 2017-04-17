document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-js-select]').forEach(actor => {
    actor.addEventListener('click', event => {
      const sel = actor.dataset.jsSelect;
      const targets = document.querySelectorAll(sel).forEach(target => {
        target.classList.remove('-active')
      });
      actor.classList.add('-active');
    });
  });

  document.querySelectorAll('[data-kit-tool]').forEach(actor => {
    actor.addEventListener('click', event => {
      const toolname = actor.dataset.kitTool;
      window.Kit.setTool(toolname);
    });
  });
});