document.addEventListener('DOMContentLoaded', () => {
  initializeNavbar();
  initializeMobileNavigation();
  initializeHeroCarousel();
  initializeAboutReveal();
});

function initializeNavbar() {
  const navigation = document.querySelector('.site-nav');

  if (!navigation) {
    return;
  }

  const updateNavigationState = () => {
    navigation.classList.toggle('site-nav--solid', window.scrollY > 24);
  };

  updateNavigationState();
  window.addEventListener('scroll', updateNavigationState, { passive: true });
}

function initializeMobileNavigation() {
  const toggleButton = document.querySelector('.nav-toggle');
  const linksContainer = document.querySelector('.nav-links');

  if (!toggleButton || !linksContainer) {
    return;
  }

  const setNavigationOpen = (isOpen) => {
    linksContainer.classList.toggle('is-open', isOpen);
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  };

  toggleButton.addEventListener('click', () => {
    setNavigationOpen(!linksContainer.classList.contains('is-open'));
  });

  linksContainer.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setNavigationOpen(false);
    }
  });
}

function initializeHeroCarousel() {
  const track = document.querySelector('[data-hero-track]');
  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  const previousButton = document.querySelector('[data-carousel-prev]');
  const nextButton = document.querySelector('[data-carousel-next]');
  const dotsContainer = document.querySelector('[data-carousel-dots]');
  const carousel = document.querySelector('.hero-carousel');

  if (!track || !slides.length || !previousButton || !nextButton || !dotsContainer || !carousel) {
    return;
  }

  let activeSlideIndex = 0;
  let autoplayTimer = null;
  const dots = [];

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      goToSlide(activeSlideIndex + 1);
    }, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetProgressBars(slideElement, isActive) {
    const bars = slideElement.querySelectorAll('[data-progress]');

    bars.forEach((bar) => {
      const target = Number(bar.getAttribute('data-progress')) || 0;
      bar.style.width = isActive ? `${target}%` : '0%';
    });
  }

  function updateTypewriters(slideElement, isActive) {
    const typewriterNodes = slideElement.querySelectorAll('[data-typewriter]');

    typewriterNodes.forEach((node) => {
      node.classList.add('typewriter-cursor');

      if (!isActive) {
        node.textContent = '';
        return;
      }

      const text = node.getAttribute('data-typewriter') || '';
      let characterIndex = 0;
      node.textContent = '';

      const renderNextCharacter = () => {
        node.textContent = text.slice(0, characterIndex);
        characterIndex += 1;

        if (characterIndex <= text.length) {
          window.setTimeout(renderNextCharacter, 30);
        }
      };

      renderNextCharacter();
    });
  }

  function updateCarousel(nextIndex) {
    activeSlideIndex = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeSlideIndex * 20}%)`;

    slides.forEach((slide, index) => {
      const isActive = index === activeSlideIndex;
      slide.classList.toggle('is-active', isActive);
      resetProgressBars(slide, isActive);
      updateTypewriters(slide, isActive);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeSlideIndex);
      dot.setAttribute('aria-current', index === activeSlideIndex ? 'true' : 'false');
    });
  }

  function goToSlide(nextIndex) {
    updateCarousel(nextIndex);
    startAutoplay();
  }

  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => {
      goToSlide(index);
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  previousButton.addEventListener('click', () => {
    goToSlide(activeSlideIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    goToSlide(activeSlideIndex + 1);
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  updateCarousel(0);
  startAutoplay();
}

function initializeAboutReveal() {
  const revealElement = document.querySelector('[data-reveal]');

  if (!revealElement) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        revealElement.classList.add('is-visible');

        const typewriterNode = revealElement.querySelector('[data-typewriter]');
        if (typewriterNode) {
          typewriterNode.classList.add('typewriter-cursor');
          const text = typewriterNode.getAttribute('data-typewriter') || '';
          let index = 0;
          typewriterNode.textContent = '';

          const typeCharacter = () => {
            typewriterNode.textContent = text.slice(0, index);
            index += 1;

            if (index <= text.length) {
              window.setTimeout(typeCharacter, 28);
            }
          };

          typeCharacter();
        }

        currentObserver.disconnect();
      });
    },
    {
      threshold: 0.25,
    }
  );

  observer.observe(revealElement);
}
