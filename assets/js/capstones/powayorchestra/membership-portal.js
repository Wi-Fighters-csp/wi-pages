(function () {
  var pythonURI;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    pythonURI = "http://localhost:8324";
  } else {
    pythonURI = "https://wifighters.opencodingsociety.com";
  }

  var STORAGE_MEMBER_PROFILES = "pso_member_profiles_v1";

  var currentUser = null;
  var selectedAdminUid = "";
  var selectedVideoName = "";
  var allRequests = [];
  var allThreads = [];

  var accountLinks = Array.prototype.slice.call(document.querySelectorAll("[data-pso-account-link]"));

  var currentUserNode = document.getElementById("pso-membership-current-user");
  var currentRoleNode = document.getElementById("pso-membership-current-role");

  var membershipHero = document.querySelector(".pso-membership-hero");
  var applicantGrid = document.querySelector(".pso-membership-grid-main");
  var applicationForm = document.getElementById("pso-membership-form");
  var formMessage = document.getElementById("pso-membership-form-message");
  var formCard = document.getElementById("pso-membership-form-card");
  var adminNote = document.getElementById("pso-membership-admin-note");
  var membershipTitle = document.getElementById("pso-membership-title");
  var membershipSubtitle = document.getElementById("pso-membership-subtitle");
  var signInLink = document.getElementById("pso-membership-signin-link");

  var videoInput = document.getElementById("pso-apply-video");
  var videoNote = document.getElementById("pso-apply-video-note");

  var userChatCard = document.getElementById("pso-user-chat-card");
  var userChatMessages = document.getElementById("pso-user-chat-messages");
  var userChatInput = document.getElementById("pso-user-chat-input");
  var userChatSend = document.getElementById("pso-user-chat-send");

  var adminCard = document.getElementById("pso-admin-card");
  var adminRequestList = document.getElementById("pso-admin-request-list");
  var adminRequestDetail = document.getElementById("pso-admin-request-detail");
  var adminChatMessages = document.getElementById("pso-admin-chat-messages");
  var adminChatInput = document.getElementById("pso-admin-chat-input");
  var adminChatSend = document.getElementById("pso-admin-chat-send");
  var adminActions = document.getElementById("pso-admin-actions");
  var adminApprove = document.getElementById("pso-admin-approve");
  var adminReject = document.getElementById("pso-admin-reject");

  var memberCustomCard = document.getElementById("pso-member-custom-card");
  var memberSave = document.getElementById("pso-member-save");
  var memberSaveMessage = document.getElementById("pso-member-save-message");

  var defaultRequestOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Origin": "client"
    }
  };

  function loadJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getMemberProfiles() {
    return loadJSON(STORAGE_MEMBER_PROFILES);
  }

  function saveMemberProfiles(value) {
    saveJSON(STORAGE_MEMBER_PROFILES, value);
  }

  function isAdmin(user) {
    if (!user) return false;
    if (user.is_admin === true) return true;
    var role = String(user.role || "").toLowerCase();
    return role === "admin" || role === "superadmin";
  }

  function getRequestForUid(uid) {
    return allRequests.find(function (request) {
      return String(request.uid) === String(uid);
    }) || null;
  }

  function isApprovedMember(user) {
    if (!user) return false;
    var role = String(user.role || "").toLowerCase();
    if (user.is_member === true) return true;
    if (role === "member" || role === "admin" || role === "superadmin") return true;

    var request = getRequestForUid(user.uid);
    return Boolean(request && request.status === "approved");
  }

  function loadServerMembershipState(user) {
    if (!user) {
      return Promise.resolve(null);
    }

    return fetch(pythonURI + "/api/pso/member-request/status", defaultRequestOptions)
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        if (!data) return user;

        if (data.is_member === true) {
          user.is_member = true;
        }

        if (data.member_request_status) {
          user.member_request_status = data.member_request_status;
        }

        if (data.request && !getRequestForUid(user.uid)) {
          allRequests.push(data.request);
        }

        return user;
      })
      .catch(function () {
        return user;
      });
  }

  function getEffectiveRole(user) {
    if (!user) return "guest";
    if (isAdmin(user)) return "admin";
    if (isApprovedMember(user)) return "member";
    var request = getRequestForUid(user.uid);
    if (request) return "applicant";
    return "user";
  }

  function getDisplayName(user) {
    if (!user) return "Guest";
    return user.name || user.uid || "Signed-in User";
  }

  function renderAccountLinks() {
    if (!accountLinks.length) return;

    accountLinks.forEach(function (link) {
      var signInHref = link.dataset.signinHref || "/powayorchestra/signin/";
      var profileHref = link.dataset.profileHref || "/powayorchestra/profile/";

      if (currentUser && currentUser.name) {
        link.textContent = currentUser.name;
        link.href = profileHref;
        link.setAttribute("aria-label", currentUser.name + " profile");
      } else {
        var signInLabel = link.dataset.signinLabel || "Sign In";
        link.textContent = signInLabel;
        link.href = signInHref;
        link.setAttribute("aria-label", signInLabel);
      }
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getInputValue(id) {
    var node = document.getElementById(id);
    return node ? node.value.trim() : "";
  }

  function setInputValue(id, value) {
    var node = document.getElementById(id);
    if (node) node.value = value || "";
  }

  function fillApplicationForm(request) {
    setInputValue("pso-apply-name", request ? request.name : (currentUser ? currentUser.name || "" : ""));
    setInputValue("pso-apply-email", request ? request.email : (currentUser ? currentUser.email || "" : ""));
    setInputValue("pso-apply-phone", request ? request.phone : "");
    setInputValue("pso-apply-instrument", request ? request.instrument : "");
    setInputValue("pso-apply-section", request ? request.section : "");
    setInputValue("pso-apply-years", request ? request.years : "");
    setInputValue("pso-apply-bio", request ? request.bio : "");
    setInputValue("pso-apply-piece", request ? request.piece : "");
    setInputValue("pso-apply-availability", request ? request.availability : "");
    setInputValue("pso-apply-video-link", request ? request.videoLink : "");
    selectedVideoName = request && request.videoFileName ? request.videoFileName : "";

    if (videoNote) {
      videoNote.textContent = selectedVideoName ? ("Selected file: " + selectedVideoName) : "No file selected.";
    }
  }

  function renderRoleSummary() {
    var role = getEffectiveRole(currentUser);

    if (!currentUser) {
      currentUserNode.textContent = "You are not signed in.";
      currentRoleNode.textContent = "Role: Guest";
      if (signInLink) {
        signInLink.hidden = false;
        signInLink.textContent = "Go to Sign In";
        signInLink.href = "/powayorchestra/signin/";
      }
      return;
    }

    currentUserNode.textContent = "Signed in as: " + getDisplayName(currentUser);
    currentRoleNode.textContent = "Role: " + role.charAt(0).toUpperCase() + role.slice(1);

    if (signInLink) {
      signInLink.hidden = false;
      if (isAdmin(currentUser) || isApprovedMember(currentUser)) {
        signInLink.textContent = "Open Profile";
        signInLink.href = "/powayorchestra/profile/";
      } else {
        signInLink.textContent = "Go to Sign In";
        signInLink.href = "/powayorchestra/signin/";
      }
    }
  }

  function setMembershipHeroForAdmin() {
    if (membershipTitle) {
      membershipTitle.textContent = "Membership Admin Hub";
    }
    if (membershipSubtitle) {
      membershipSubtitle.textContent = "Review membership requests and communicate with applicants.";
    }
  }

  function setMembershipHeroForDefault() {
    if (membershipTitle) {
      membershipTitle.textContent = "Apply to Join the Orchestra";
    }
    if (membershipSubtitle) {
      membershipSubtitle.textContent = "Submit an audition or interview request, share your musical background, and connect directly with the orchestra team.";
    }
  }

  function setApplicationInputsDisabled(disabled) {
    if (!applicationForm) return;

    Array.prototype.forEach.call(applicationForm.querySelectorAll("input, textarea, select, button"), function (node) {
      node.disabled = disabled;
    });
  }

  function renderApplicantArea() {
    var isAdminUser = currentUser && isAdmin(currentUser);
    var isMemberUser = currentUser && isApprovedMember(currentUser) && !isAdminUser;
    var request = currentUser ? getRequestForUid(currentUser.uid) : null;

    fillApplicationForm(request);
    setMembershipHeroForDefault();

    if (formCard) {
      formCard.hidden = false;
    }
    if (adminNote) {
      adminNote.hidden = true;
    }

    if (isAdminUser) {
      setMembershipHeroForAdmin();
      if (membershipHero) membershipHero.hidden = false;
      if (applicantGrid) applicantGrid.hidden = false;
      if (formCard) formCard.hidden = true;
      if (adminNote) adminNote.hidden = false;
      if (formMessage) formMessage.textContent = "";
      return;
    }

    if (isMemberUser) {
      if (membershipHero) membershipHero.hidden = true;
      if (applicantGrid) applicantGrid.hidden = true;
      if (formMessage) formMessage.textContent = "";
      return;
    }

    if (membershipHero) membershipHero.hidden = false;
    if (applicantGrid) applicantGrid.hidden = false;

    if (!currentUser) {
      setApplicationInputsDisabled(true);
      if (formMessage) {
        formMessage.textContent = "Sign in first to submit an application.";
      }
      return;
    }

    setApplicationInputsDisabled(false);

    if (request && formMessage) {
      formMessage.innerHTML = 'Your current request status: <span class="pso-status-pill ' + escapeHtml(request.status) + '">' + escapeHtml(request.status) + "</span>";
    } else if (formMessage) {
      formMessage.textContent = "You have not submitted a request yet.";
    }
  }

  function renderChatMessages(node, messages) {
    if (!node) return;

    if (!messages || !messages.length) {
      node.innerHTML = '<p class="pso-chat-empty">No messages yet.</p>';
      return;
    }

    node.innerHTML = messages.map(function (message) {
      var senderRole = message.sender_role || message.senderRole || "user";
      var senderName = message.sender_name || message.senderName || "User";
      var createdAt = message.created_at || message.createdAt || "";

      return (
        '<div class="pso-chat-message ' + escapeHtml(senderRole) + '">' +
          '<strong>' + escapeHtml(senderName) + '</strong>' +
          '<div>' + escapeHtml(message.text) + '</div>' +
          '<small>' + escapeHtml(createdAt) + '</small>' +
        '</div>'
      );
    }).join("");

    node.scrollTop = node.scrollHeight;
  }

  function loadRequests() {
    return fetch(pythonURI + "/api/pso/admin/member-requests?status=all", defaultRequestOptions)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }

        if (currentUser) {
          return fetch(pythonURI + "/api/pso/member-request/status", defaultRequestOptions)
            .then(function (fallbackResponse) {
              if (!fallbackResponse.ok) return { requests: [] };
              return fallbackResponse.json().then(function (data) {
                if (data && data.request) {
                  return { requests: [data.request] };
                }
                return { requests: [] };
              });
            });
        }

        return { requests: [] };
      })
      .then(function (data) {
        allRequests = data && Array.isArray(data.requests) ? data.requests : [];
        return allRequests;
      })
      .catch(function () {
        allRequests = [];
        return [];
      });
  }

  function loadAdminThreads() {
    if (!currentUser || !isAdmin(currentUser)) {
      allThreads = [];
      return Promise.resolve([]);
    }

    return fetch(pythonURI + "/api/pso/admin/chat/threads", defaultRequestOptions)
      .then(function (response) {
        if (!response.ok) return { threads: [] };
        return response.json();
      })
      .then(function (data) {
        allThreads = data && Array.isArray(data.threads) ? data.threads : [];
        return allThreads;
      })
      .catch(function () {
        allThreads = [];
        return [];
      });
  }

  function loadThread(uid) {
    return fetch(pythonURI + "/api/pso/chat/thread?thread_uid=" + encodeURIComponent(uid), defaultRequestOptions)
      .then(function (response) {
        if (!response.ok) {
          return {
            uid: uid,
            messages: []
          };
        }
        return response.json();
      })
      .catch(function () {
        return {
          uid: uid,
          messages: []
        };
      });
  }

  function renderUserChat() {
    if (!currentUser || isAdmin(currentUser)) {
      userChatCard.hidden = true;
      return Promise.resolve();
    }

    var request = getRequestForUid(currentUser.uid);
    if (!request && !isApprovedMember(currentUser)) {
      userChatCard.hidden = true;
      return Promise.resolve();
    }

    userChatCard.hidden = false;

    return loadThread(currentUser.uid).then(function (thread) {
      renderChatMessages(userChatMessages, thread.messages || []);
    });
  }

  function renderMemberCustomization() {
    memberCustomCard.hidden = !currentUser || !isApprovedMember(currentUser) || isAdmin(currentUser);
  }

  function renderAdminList() {
    if (!currentUser || !isAdmin(currentUser)) {
      adminCard.hidden = true;
      return;
    }

    adminCard.hidden = false;

    var requests = allRequests;
    if (!requests.length) {
      adminRequestList.innerHTML = '<div class="pso-admin-request-item"><strong>No requests yet.</strong><p>Applications submitted from any device will appear here after users submit them.</p></div>';
      adminRequestDetail.innerHTML = "<p>Select a request to review.</p>";
      renderChatMessages(adminChatMessages, []);
      adminActions.hidden = true;
      return;
    }

    adminRequestList.innerHTML = requests.map(function (request) {
      var activeClass = String(selectedAdminUid) === String(request.uid) ? " is-active" : "";
      return (
        '<button class="pso-admin-request-item' + activeClass + '" type="button" data-admin-request-uid="' + escapeHtml(request.uid) + '">' +
          '<strong>' + escapeHtml(request.name) + '</strong>' +
          '<p>' + escapeHtml(request.instrument) + " • " + escapeHtml(request.section) + '</p>' +
          '<span class="pso-status-pill ' + escapeHtml(request.status) + '">' + escapeHtml(request.status) + "</span>" +
        "</button>"
      );
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("[data-admin-request-uid]"), function (button) {
      button.addEventListener("click", function () {
        selectedAdminUid = this.getAttribute("data-admin-request-uid") || "";
        renderAdminDetail();
        renderAdminList();
      });
    });

    if (!selectedAdminUid && requests.length) {
      selectedAdminUid = requests[0].uid;
    }

    renderAdminDetail();
  }

  function renderAdminDetail() {
    if (!currentUser || !isAdmin(currentUser) || !selectedAdminUid) {
      adminRequestDetail.innerHTML = "<p>Select a request to review.</p>";
      renderChatMessages(adminChatMessages, []);
      adminActions.hidden = true;
      return;
    }

    var request = getRequestForUid(selectedAdminUid);
    if (!request) {
      adminRequestDetail.innerHTML = "<p>Request not found.</p>";
      renderChatMessages(adminChatMessages, []);
      adminActions.hidden = true;
      return;
    }

    adminRequestDetail.innerHTML =
      '<div class="pso-admin-request-meta">' +
        "<strong>" + escapeHtml(request.name) + "</strong>" +
        '<span class="pso-status-pill ' + escapeHtml(request.status) + '">' + escapeHtml(request.status) + "</span>" +
        "<div><strong>Email:</strong> " +
          (request.email
            ? '<a href="mailto:' + escapeHtml(request.email) + '" class="pso-admin-email-link">' + escapeHtml(request.email) + "</a>"
            : "--") +
        "</div>" +
        "<div><strong>Phone:</strong> " + escapeHtml(request.phone || "--") + "</div>" +
        "<div><strong>Instrument:</strong> " + escapeHtml(request.instrument) + "</div>" +
        "<div><strong>Section:</strong> " + escapeHtml(request.section) + "</div>" +
        "<div><strong>Experience:</strong> " + escapeHtml(request.years || "--") + "</div>" +
        "<div><strong>Piece:</strong> " + escapeHtml(request.piece || "--") + "</div>" +
        "<div><strong>Availability:</strong> " + escapeHtml(request.availability || "--") + "</div>" +
        "<div><strong>Video file:</strong> " + escapeHtml(request.videoFileName || "None uploaded") + "</div>" +
        "<div><strong>Video link:</strong> " +
          (request.videoLink
            ? '<a href="' + escapeHtml(request.videoLink) + '" target="_blank" rel="noopener">Open link</a>'
            : "None provided") +
        "</div>" +
        "<div><strong>Background:</strong> " + escapeHtml(request.bio || "--") + "</div>" +
      "</div>";

    adminActions.hidden = false;

    loadThread(selectedAdminUid).then(function (thread) {
      renderChatMessages(adminChatMessages, thread.messages || []);
    });
  }

  function handleApplicationSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      formMessage.textContent = "Please sign in before submitting a request.";
      return;
    }

    if (isAdmin(currentUser)) {
      formMessage.textContent = "Admin accounts do not need to submit membership requests.";
      return;
    }

    var payload = {
      name: getInputValue("pso-apply-name"),
      email: getInputValue("pso-apply-email"),
      phone: getInputValue("pso-apply-phone"),
      instrument: getInputValue("pso-apply-instrument"),
      section: getInputValue("pso-apply-section"),
      years: getInputValue("pso-apply-years"),
      bio: getInputValue("pso-apply-bio"),
      piece: getInputValue("pso-apply-piece"),
      availability: getInputValue("pso-apply-availability"),
      videoLink: getInputValue("pso-apply-video-link"),
      videoFileName: selectedVideoName
    };

    if (!payload.name || !payload.email || !payload.instrument || !payload.section || !payload.bio) {
      formMessage.textContent = "Please fill out the required fields.";
      return;
    }

    fetch(pythonURI + "/api/pso/member-request", {
      method: "POST",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to submit request.");
        }
        return response.json();
      })
      .then(function () {
        formMessage.innerHTML = 'Request submitted. Status: <span class="pso-status-pill pending">pending</span>';
        return loadRequests();
      })
      .then(function () {
        return renderAll();
      })
      .catch(function (error) {
        formMessage.textContent = error.message || "Unable to submit request.";
      });
  }

  function sendUserMessage() {
    if (!currentUser) return;
    var text = (userChatInput.value || "").trim();
    if (!text) return;

    userChatSend.disabled = true;

    fetch(pythonURI + "/api/pso/chat/messages", {
      method: "POST",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      },
      body: JSON.stringify({
        thread_uid: currentUser.uid,
        text: text
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to send message.");
        }
        return response.json();
      })
      .then(function () {
        userChatInput.value = "";
        return renderUserChat();
      })
      .catch(function () {
      })
      .finally(function () {
        userChatSend.disabled = false;
      });
  }

  function sendAdminMessage() {
    if (!currentUser || !isAdmin(currentUser) || !selectedAdminUid) return;
    var text = (adminChatInput.value || "").trim();
    if (!text) return;

    adminChatSend.disabled = true;

    fetch(pythonURI + "/api/pso/chat/messages", {
      method: "POST",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      },
      body: JSON.stringify({
        thread_uid: selectedAdminUid,
        text: text
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to send message.");
        }
        return response.json();
      })
      .then(function () {
        adminChatInput.value = "";
        return loadAdminThreads();
      })
      .then(function () {
        renderAdminList();
      })
      .catch(function () {
      })
      .finally(function () {
        adminChatSend.disabled = false;
      });
  }

  function updateRequestStatus(nextStatus) {
    if (!selectedAdminUid) return;

    var request = getRequestForUid(selectedAdminUid);
    if (!request) return;

    var action = nextStatus === "approved" ? "approve" : "reject";

    fetch(pythonURI + "/api/pso/admin/member-requests/" + encodeURIComponent(request.id) + "/" + action, {
      method: "POST",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to update request.");
        }
        return response.json();
      })
      .then(function () {
        return loadRequests();
      })
      .then(function () {
        return loadAdminThreads();
      })
      .then(function () {
        return renderAll();
      })
      .catch(function () {
      });
  }

  function saveMemberProfile() {
    if (!currentUser || !isApprovedMember(currentUser)) {
      memberSaveMessage.textContent = "Only approved members can save member profile details.";
      return;
    }

    var profiles = getMemberProfiles();
    var nextProfile = {
      uid: currentUser.uid,
      displayName: getInputValue("pso-member-display-name"),
      section: getInputValue("pso-member-section"),
      instruments: getInputValue("pso-member-instruments"),
      featuredPiece: getInputValue("pso-member-featured-piece"),
      imageUrl: getInputValue("pso-member-image"),
      bio: getInputValue("pso-member-bio")
    };

    var existingIndex = profiles.findIndex(function (profile) {
      return String(profile.uid) === String(currentUser.uid);
    });

    if (existingIndex === -1) {
      profiles.push(nextProfile);
    } else {
      profiles[existingIndex] = nextProfile;
    }

    saveMemberProfiles(profiles);
    memberSaveMessage.textContent = "Member profile saved.";
  }

  function attachEvents() {
    if (videoInput) {
      videoInput.addEventListener("change", function () {
        var file = this.files && this.files[0] ? this.files[0] : null;
        selectedVideoName = file ? file.name : "";
        if (videoNote) {
          videoNote.textContent = selectedVideoName ? ("Selected file: " + selectedVideoName) : "No file selected.";
        }
      });
    }

    if (applicationForm) {
      applicationForm.addEventListener("submit", handleApplicationSubmit);
    }

    if (userChatSend) {
      userChatSend.addEventListener("click", sendUserMessage);
    }

    if (adminChatSend) {
      adminChatSend.addEventListener("click", sendAdminMessage);
    }

    if (adminApprove) {
      adminApprove.addEventListener("click", function () {
        updateRequestStatus("approved");
      });
    }

    if (adminReject) {
      adminReject.addEventListener("click", function () {
        updateRequestStatus("rejected");
      });
    }

    if (memberSave) {
      memberSave.addEventListener("click", saveMemberProfile);
    }
  }

  function renderAll() {
    renderAccountLinks();
    renderRoleSummary();
    renderApplicantArea();
    renderMemberCustomization();
    renderAdminList();
    return renderUserChat();
  }

  function loadCurrentUser() {
    return fetch(pythonURI + "/api/id", defaultRequestOptions)
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        currentUser = data && data.uid ? data : null;
        return loadRequests();
      })
      .then(function () {
        return loadServerMembershipState(currentUser);
      })
      .then(function (resolvedUser) {
        currentUser = resolvedUser && resolvedUser.uid ? resolvedUser : currentUser;

        if (currentUser && isAdmin(currentUser)) {
          return loadAdminThreads();
        }

        allThreads = [];
        return [];
      })
      .then(function () {
        return renderAll();
      })
      .catch(function () {
        currentUser = null;
        allRequests = [];
        allThreads = [];
        renderAll();
      });
  }

  attachEvents();
  loadCurrentUser();
})();