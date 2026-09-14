/**
 * Kivanta Advisory - Public Site Main Controller (Visual Refinement Pass)
 */

(function ($) {
  "use strict";

  // Spinner Dismissal Fix
  function hideSpinner() {
    const $spinner = $('#spinner');
    if ($spinner.length > 0) {
      $spinner.removeClass('show');
    }
  }

  // Dismiss spinner immediately and on event hooks
  hideSpinner();
  setTimeout(hideSpinner, 1);
  setTimeout(hideSpinner, 50);

  // Initialize DB & Carousel on page load
  document.addEventListener('DOMContentLoaded', async () => {
    hideSpinner();
    if (window.KivantaDB) {
      try {
        await window.KivantaDB.init();
      } catch (e) {
        console.warn('KivantaDB initialization fallback', e);
      }
    }
    initTheme();
    initModals();
    initPublicForms();
    initBigFiveCarousel();
  });

  window.addEventListener('load', hideSpinner);

  // Big Five Hero Carousel Controller
  function initBigFiveCarousel() {
    const $carousel = $('#heroBigFiveCarousel');
    if ($carousel.length === 0) return;

    const $slides = $carousel.find('.hero-carousel-slide');
    const $dots = $carousel.find('.hero-carousel-dot');
    const $counter = $('#heroSlideCounter');
    let currentIndex = 0;
    const totalSlides = $slides.length;
    let autoTimer = null;

    function showSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentIndex = index;

      $slides.removeClass('active').eq(currentIndex).addClass('active');
      $dots.removeClass('active').eq(currentIndex).addClass('active');

      const slideNum = String(currentIndex + 1).padStart(2, '0');
      const totalNum = String(totalSlides).padStart(2, '0');
      $counter.text(`${slideNum} / ${totalNum}`);
    }

    function nextSlide() {
      showSlide(currentIndex + 1);
    }

    function prevSlide() {
      showSlide(currentIndex - 1);
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoTimer = setInterval(nextSlide, 6000);
    }

    function stopAutoPlay() {
      if (autoTimer) clearInterval(autoTimer);
    }

    $('#heroNextBtn').on('click', function (e) {
      e.preventDefault();
      nextSlide();
      startAutoPlay();
    });

    $('#heroPrevBtn').on('click', function (e) {
      e.preventDefault();
      prevSlide();
      startAutoPlay();
    });

    $dots.on('click', function () {
      const slideIdx = parseInt($(this).data('slide'), 10);
      showSlide(slideIdx);
      startAutoPlay();
    });

    $carousel.on('mouseenter touchstart', stopAutoPlay);
    $carousel.on('mouseleave touchend', startAutoPlay);

    // Initial display & start timer
    showSlide(0);
    startAutoPlay();
  }

  // Theme Switcher Logic (Delegated to window.KivantaTheme)
  function initTheme() {
    if (window.KivantaTheme) {
      window.KivantaTheme.init();
    }
  }

  // Sticky Navbar
  $(window).scroll(function () {
    if ($(this).scrollTop() > 45) {
      $('.nav-bar').addClass('sticky-top');
    } else {
      $('.nav-bar').removeClass('sticky-top');
    }
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 800, 'easeInOutExpo');
    return false;
  });

  // Consultation Modal Definition (Structured 2-Column Grid)
  function initModals() {
    if ($('#consultationModal').length === 0) {
      const modalHtml = `
        <div class="modal fade" id="consultationModal" tabindex="-1" aria-labelledby="consultationModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg" style="max-width: 740px;">
            <div class="modal-content" style="background-color: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 12px;">
              <div class="modal-header border-bottom border-secondary py-3 px-4">
                <h5 class="modal-title font-heading fw-semibold m-0" id="consultationModalLabel"><i class="fas fa-calendar-check text-warning me-2"></i>Book a Professional Consultation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <form id="publicConsultationForm">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Full Name *</label>
                      <input type="text" name="name" class="form-control" placeholder="John Doe" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Company Name</label>
                      <input type="text" name="company" class="form-control" placeholder="Company Ltd">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Work Email *</label>
                      <input type="email" name="email" class="form-control" placeholder="john@example.com" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Phone / WhatsApp *</label>
                      <input type="text" name="phone" class="form-control" placeholder="+254 700 000 000" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Country of Residence / HQ</label>
                      <input type="text" name="country" class="form-control" placeholder="Kenya, UK, USA, etc.">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label font-heading small mb-1">Primary Service Required *</label>
                      <select name="service" class="form-select" required>
                        <option value="">Select Service Category...</option>
                        <option value="Company Registration">Company Registration (Private Limited)</option>
                        <option value="Foreign Branch Registration">Foreign Branch Office Setup</option>
                        <option value="Work Permits">Work Permits (Class G / Class D)</option>
                        <option value="Tax & KRA Compliance">Tax & KRA Compliance</option>
                        <option value="Bookkeeping & Payroll">Bookkeeping & Payroll</option>
                        <option value="Corporate Secretarial">Corporate Secretarial</option>
                        <option value="Kenya Market Entry Advisory">Kenya Market Entry Advisory</option>
                        <option value="Other Regulatory Support">Other Regulatory Support</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="form-label font-heading small mb-1">Brief Details of Your Inquiry *</label>
                      <textarea name="message" class="form-control" rows="3" placeholder="Explain your business requirements, timeline, or current challenge..." required></textarea>
                    </div>
                  </div>
                  <div class="mt-4 text-end">
                    <button type="button" class="btn btn-outline-secondary btn-sm me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane me-1"></i>Submit Consultation Request</button>
                  </div>
                </form>
                <div id="consultationSuccess" class="alert alert-success d-none mt-3 mb-0" role="alert">
                  <i class="fas fa-check-circle me-2"></i>Thank you! Your consultation request has been received. Our advisory team will respond within 24 hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      $('body').append(modalHtml);
    }
  }

  // Handle Form Submissions
  function initPublicForms() {
    $(document).on('submit', '#publicConsultationForm', function (e) {
      e.preventDefault();
      const data = {
        name: $(this).find('[name="name"]').val(),
        company: $(this).find('[name="company"]').val(),
        email: $(this).find('[name="email"]').val(),
        phone: $(this).find('[name="phone"]').val(),
        country: $(this).find('[name="country"]').val(),
        service: $(this).find('[name="service"]').val(),
        message: $(this).find('[name="message"]').val()
      };

      if (window.KivantaDB) {
        window.KivantaDB.addConsultationRequest(data);
      }

      $('#publicConsultationForm').addClass('d-none');
      $('#consultationSuccess').removeClass('d-none');

      setTimeout(() => {
        $('#consultationModal').modal('hide');
        $('#publicConsultationForm').removeClass('d-none')[0].reset();
        $('#consultationSuccess').addClass('d-none');
      }, 2500);
    });
  }

  // Trigger consultation modal programmatically
  window.openConsultationModal = function (serviceName = '') {
    if (serviceName) {
      $('#consultationModal select[name="service"]').val(serviceName);
    }
    const myModal = new bootstrap.Modal(document.getElementById('consultationModal'));
    myModal.show();
  };

})(jQuery);
