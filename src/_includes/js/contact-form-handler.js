document.addEventListener("DOMContentLoaded",function(){contactFormHandler();},false);

function contactFormHandler() {

  const contact_form = document.getElementById("contact-form");
  const recaptcha_site_key = document.getElementById("recaptcha-site-key");

  const name_input = contact_form.querySelector("#name");
  const email_input = contact_form.querySelector("#email");
  const message_input = contact_form.querySelector("#message");
  const password_input = contact_form.querySelector("#password");
  const subject_input = contact_form.querySelector("#subject");
  const heading_input = contact_form.querySelector("#heading");
  const gRecaptchaResponse_input = contact_form.querySelector("#gRecaptchaResponse");

  disableContactForm();

  name_input.onfocus = hideError();
  email_input.onfocus = hideError();
  message_input.onfocus = hideError();

  contact_form.addEventListener("submit", event => {

    event.preventDefault();

    disableContactForm();

    const inputs = contact_form.querySelectorAll("input,textarea");
    for(let i = 0; i < inputs.length; i++) {
      if((window.getComputedStyle(inputs[i]).display !== "none") && (inputs[i].name !== "password")) {
        if(inputs[i].value.trim().length === 0) {
          showError(inputs[i].dataset.error || "Form Error");
          enableContactForm();
          return false;
        }
      }
    };

    grecaptcha.ready(function() {
      grecaptcha.execute(recaptcha_site_key.value, {action: "contactform"}).then(function(token) {
        document.getElementById("gRecaptchaResponse").value = token;

        let ok = false;

        fetch('/php/contact-form-handler', {
          method: 'post',
          body: JSON.stringify({
            name: name_input.value,
            email: email_input.value,
            message: message_input.value,
            password: password_input.value,
            subject: subject_input.value,
            heading: heading_input.value,
            gRecaptchaResponse: gRecaptchaResponse_input.value
          })
        }).then(function(response) {
          ok = response.ok;
          return response.json();
        }).then(function(data) {
          if(ok) {
            finishContactForm();
            return true;
          } else {
            showError(data.error);
            enableContactForm();
            return false;
          }
        }).catch(function(err) {
          console.error(err);
        });
      });
    });
  },false);

  enableContactForm();
}

function showError(message) {
  const error_msg = document.getElementById('error-msg');
  if(error_msg) {
    error_msg.innerText = message;
    error_msg.style.visibility = "visible";
  }
}

function hideError() {
  const error_msg = document.getElementById('error-msg');
  if(error_msg) {
    error_msg.style.visibility = "hidden";
  }
}

function enableContactForm() {
  document.getElementById("submit-button").disabled = false;
  document.getElementById("spinner-icon").style.display = "none";
  document.getElementById("ok-icon").style.display = "none";
  document.getElementById("email-icon").style.display = "inline-block";
  document.getElementById("submit-text").innerText = "Send";
}

function disableContactForm() {
  document.getElementById("submit-button").disabled = true;
  document.getElementById("spinner-icon").style.display = "inline-block";
  document.getElementById("ok-icon").style.display = "none";
  document.getElementById("email-icon").style.display = "none";
  document.getElementById("submit-text").innerText = "Sending";
}

function finishContactForm() {
  document.getElementById("submit-button").disabled = true;
  document.getElementById("spinner-icon").style.display = "none";
  document.getElementById("ok-icon").style.display = "inline-block";
  document.getElementById("email-icon").style.display = "none";
  document.getElementById("submit-text").innerText = "Message Sent";
}

