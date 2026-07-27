export default class ChatGPTTyper {
    constructor(selector, options = {}) {
        this.el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.el) return;

        this.speed = options.speed ?? 8;
        this.tail = options.tail ?? 8;
        this.finalColor = options.finalColor ?? "#fff";
        this.tailColor = options.tailColor ?? "rgb(207, 255, 94)";
        
        // Новая опция: позволяет отключить автостарт при появлении во вьюпорте
        this.startOnView = options.startOnView !== false; 

        this.nodes = [];
        this.index = 0;

        // Мгновенно подготавливаем DOM (разбиваем на спаны с opacity 0)
        this.prepare(this.el);
        
        // Запускаем IntersectionObserver только если разрешен автостарт
        if (this.startOnView) {
            this.observe();
        }
    }

    prepare(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim()) {
                textNodes.push(walker.currentNode);
            }
        }

        textNodes.forEach(node => {
            const frag = document.createDocumentFragment();
            [...node.textContent].forEach(char => {
                const span = document.createElement("span");
                span.className = "gpt-char"; 
                span.textContent = char;
                span.style.opacity = "0";
                span.style.color = this.tailColor;
                frag.appendChild(span);
                this.nodes.push(span);
            });
            node.parentNode.replaceChild(frag, node);
        });

        // Делаем родительский контейнер видимым только ПОСЛЕ того, 
        // как разбили текст на прозрачные спаны. Это убирает мигание.
        this.el.style.opacity = "1";
    }

    observe() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.tick();
                    observer.disconnect(); 
                }
            });
        }, { threshold: 0.5 }); 

        observer.observe(this.el);
    }

    // Новый метод для ручного запуска машинки
    start() {
        this.tick();
    }

   tick() {
        // Если все буквы напечатаны, докрашиваем последний "хвост" в белый цвет и останавливаем таймер
        if (this.index >= this.nodes.length) {
            const from = Math.max(0, this.nodes.length - this.tail);
            for (let i = from; i < this.nodes.length; i++) {
                this.nodes[i].style.color = this.finalColor;
            }
            return;
        }

        // Показываем текущую букву
        const current = this.nodes[this.index];
        current.style.opacity = "1";

        // Вычисляем начало хвоста и красим предыдущие буквы в финальный цвет
        const from = Math.max(0, this.index - this.tail);
        for (let i = from; i < this.index; i++) {
            this.nodes[i].style.color = this.finalColor;
        }

        // Идем к следующей букве
        this.index++;
        setTimeout(() => this.tick(), this.speed);
    }
}