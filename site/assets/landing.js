(function () {
  const COPIED_MS = 2000;
  const feedbackTimers = new WeakMap();

  function copyWithExecCommand(text) {
    return new Promise(function (resolve, reject) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        if (!document.execCommand("copy")) {
          reject(new Error("execCommand copy failed"));
          return;
        }
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyWithExecCommand(text);
      });
    }

    return copyWithExecCommand(text);
  }

  function buttonLabel(button) {
    return (button.getAttribute("data-label") || button.textContent || "Copy")
      .replace(/\s+/g, " ")
      .trim();
  }

  function originalAriaLabel(button) {
    return (
      button.getAttribute("data-aria-label") ||
      button.getAttribute("aria-label") ||
      buttonLabel(button)
    );
  }

  function clearFeedbackTimer(button) {
    const timer = feedbackTimers.get(button);
    if (timer) {
      window.clearTimeout(timer);
      feedbackTimers.delete(button);
    }
  }

  function announce(message) {
    const region = document.getElementById("copy-status");
    if (!region) {
      return;
    }
    region.textContent = "";
    window.requestAnimationFrame(function () {
      region.textContent = message;
    });
  }

  function setFeedback(button, feedbackText, isSuccess) {
    const label = buttonLabel(button);
    const ariaLabel = originalAriaLabel(button);
    button.setAttribute("data-label", label);
    button.setAttribute("data-aria-label", ariaLabel);
    button.classList.toggle("is-copied", isSuccess);
    button.textContent = feedbackText;
    button.setAttribute("aria-label", feedbackText);
    announce(feedbackText);
    clearFeedbackTimer(button);

    const timer = window.setTimeout(function () {
      button.classList.remove("is-copied");
      button.textContent = label;
      button.setAttribute("aria-label", ariaLabel);
      feedbackTimers.delete(button);
    }, COPIED_MS);
    feedbackTimers.set(button, timer);
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest(".copy-btn");
    if (!button) {
      return;
    }

    const targetId = button.getAttribute("data-copy-target");
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    const text = (target.textContent || "").replace(/\u00a0/g, " ").trim();
    if (!text) {
      return;
    }

    copyText(text)
      .then(function () {
        setFeedback(button, "Copied", true);
      })
      .catch(function () {
        setFeedback(button, "Failed", false);
      });
  });
})();
