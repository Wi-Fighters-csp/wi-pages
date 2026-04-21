(function () {
  var pythonURI;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    pythonURI = "http://localhost:8324";
  } else {
    pythonURI = "https://wifighters.opencodingsociety.com";
  }

  var STORAGE_REQUESTS = "pso_membership_requests_v1";
  var STORAGE_THREADS = "pso_membership_threads_v1";
  var STORAGE_MEMBER_PROFILES = "pso_member_profiles_v1";

  var currentUser = null;
  var selectedAdminUid = "";
  var selectedVideoName = "";
  var accountLinks = Array.prototype.slice.call(document.querySelectorAll("[data-pso-account-link]"));

  var currentUserNode = document.getElementById("pso-membership-current-user");
  var currentRoleNode = document.getElementById("pso-membership-current-role");

  var membershipHero = document.querySelector(".pso-membership-hero");
  var applicantGrid = document.querySelector(".pso-membership-grid-main");
  var applicationForm = document.getElementById("pso-membership-form");
  var formMessage = document.getElementById("pso-membership-form-message");
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

  function getRequests() {
    return loadJSON(STORAGE_REQUESTS);
  }

  function saveRequests(value) {
    saveJSON(STORAGE_REQUESTS, value);
  }

  function getThreads() {
    return loadJSON(STORAGE_THREADS);
  }

  function saveThreads(value) {
    saveJSON(STORAGE_THREADS, value);
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
    return getRequests().find(function (request) {
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

    return fetch(pythonURI + "/api/pso/member-request/status", {
      method: "GET",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      }
    })
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

  function nowLabel() {
    return new Date().toLocaleString();
  }

  function getThreadForUid(uid) {
    var threads = getThreads();
    var thread = threads.find(function (item) {
      return String(item.uid) === String(uid);
    });
    if (thread) return thread;

    var newThread = {
      uid: uid,
      messages: []
    };
    threads.push(newThread);
    saveThreads(threads);
    return newThread;
  }

  function updateThreadForUid(uid, updater) {
    var threads = getThreads();
    var index = threads.findIndex(function (item) {
      return String(item.uid) === String(uid);
    });

    if (index === -1) {
      threads.push({ uid: uid, messages: [] });
      index = threads.length - 1;
    }

    threads[index] = updater(threads[index]);
    saveThreads(threads);
  }

  function renderChatMessages(node, messages) {
    if (!node) return;

    if (!messages || !messages.length) {
      node.innerHTML = '<p class="pso-chat-empty">No messages yet.</p>';
      return;
    }

    node.innerHTML = messages.map(function (message) {
      return (
        '<div class="pso-chat-message ' + escapeHtml(message.senderRole) + '">' +
          '<strong>' + escapeHtml(message.senderName) + '</strong>' +
          '<div>' + escapeHtml(message.text) + '</div>' +
          '<small>' + escapeHtml(message.createdAt) + '</small>' +
        '</div>'
      );
    }).join("");

    node.scrollTop = node.scrollHeight;
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
    setInputValue("pso-apply-email", request ? request.email : "");
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
      return;
    }

    currentUserNode.textContent = "Signed in as: " + getDisplayName(currentUser);
    currentRoleNode.textContent = "Role: " + role.charAt(0).toUpperCase() + role.slice(1);
  }

  function renderApplicantArea() {
    var isMember = currentUser && isApprovedMember(currentUser) && !isAdmin(currentUser);
    var request = currentUser ? getRequestForUid(currentUser.uid) : null;
    fillApplicationForm(request);

    if (membershipHero) {
      membershipHero.hidden = isMember;
    }

    if (applicantGrid) {
      applicantGrid.hidden = isMember;
    }

    if (isMember) {
      if (formMessage) {
        formMessage.textContent = "";
      }
      return;
    }

    if (!currentUser) {
      Array.prototype.forEach.call(applicationForm.querySelectorAll("input, textarea, select, button"), function (node) {
        node.disabled = true;
      });
      formMessage.textContent = "Sign in first to submit an application.";
      return;
    }

    Array.prototype.forEach.call(applicationForm.querySelectorAll("input, textarea, select, button"), function (node) {
      node.disabled = false;
    });

    if (request) {
      formMessage.innerHTML = 'Your current request status: <span class="pso-status-pill ' + escapeHtml(request.status) + '">' + escapeHtml(request.status) + "</span>";
    } else {
      formMessage.textContent = "You have not submitted a request yet.";
    }
  }

  function renderUserChat() {
    if (!currentUser || isAdmin(currentUser)) {
      userChatCard.hidden = true;
      return;
    }

    var request = getRequestForUid(currentUser.uid);
    if (!request && !isApprovedMember(currentUser)) {
      userChatCard.hidden = true;
      return;
    }

    userChatCard.hidden = false;
    var thread = getThreadForUid(currentUser.uid);
    renderChatMessages(userChatMessages, thread.messages);
  }

  function renderMemberCustomization() {
    memberCustomCard.hidden = false;
  }

  function renderAdminList() {
    if (!currentUser || !isAdmin(currentUser)) {
      adminCard.hidden = true;
      return;
    }

    adminCard.hidden = false;

    var requests = getRequests();
    if (!requests.length) {
      adminRequestList.innerHTML = '<div class="pso-admin-request-item"><strong>No requests yet.</strong><p>Applications will appear here after users submit them.</p></div>';
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
        "<div><strong>Email:</strong> " + escapeHtml(request.email) + "</div>" +
        "<div><strong>Phone:</strong> " + escapeHtml(request.phone || "--") + "</div>" +
        "<div><strong>Instrument:</strong> " + escapeHtml(request.instrument) + "</div>" +
        "<div><strong>Section:</strong> " + escapeHtml(request.section) + "</div>" +
        "<div><strong>Experience:</strong> " + escapeHtml(request.years || "--") + "</div>" +
        "<div><strong>Piece:</strong> " + escapeHtml(request.piece || "--") + "</div>" +
        "<div><strong>Availability:</strong> " + escapeHtml(request.availability || "--") + "</div>" +
        "<div><strong>Video file:</strong> " + escapeHtml(request.videoFileName || "None uploaded") + "</div>" +
        "<div><strong>Video link:</strong> " + (request.videoLink ? '<a href="' + escapeHtml(request.videoLink) + '" target="_blank" rel="noopener">Open link</a>' : "None provided") + "</div>" +
        "<div><strong>Background:</strong> " + escapeHtml(request.bio || "--") + "</div>" +
      "</div>";

    adminActions.hidden = false;

    var thread = getThreadForUid(selectedAdminUid);
    renderChatMessages(adminChatMessages, thread.messages);
  }

  function saveOrUpdateRequest(payload) {
    var requests = getRequests();
    var existingIndex = requests.findIndex(function (request) {
      return String(request.uid) === String(payload.uid);
    });

    if (existingIndex === -1) {
      requests.push(payload);
    } else {
      var oldStatus = requests[existingIndex].status || "pending";
      requests[existingIndex] = Object.assign({}, payload, {
        status: oldStatus === "approved" ? "approved" : "pending"
      });
    }

    saveRequests(requests);
  }

  function handleApplicationSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      formMessage.textContent = "Please sign in before submitting a request.";
      return;
    }

    var payload = {
      uid: currentUser.uid,
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
      videoFileName: selectedVideoName,
      status: "pending",
      submittedAt: nowLabel()
    };

    if (!payload.name || !payload.email || !payload.instrument || !payload.section || !payload.bio) {
      formMessage.textContent = "Please fill out the required fields.";
      return;
    }

    saveOrUpdateRequest(payload);
    getThreadForUid(currentUser.uid);

    formMessage.innerHTML = 'Request submitted. Status: <span class="pso-status-pill pending">pending</span>';
    renderAll();
  }

  function sendUserMessage() {
    if (!currentUser) return;
    var text = (userChatInput.value || "").trim();
    if (!text) return;

    updateThreadForUid(currentUser.uid, function (thread) {
      thread.messages.push({
        senderRole: "user",
        senderName: getDisplayName(currentUser),
        text: text,
        createdAt: nowLabel()
      });
      return thread;
    });

    userChatInput.value = "";
    renderUserChat();
    renderAdminDetail();
  }

  function sendAdminMessage() {
    if (!currentUser || !isAdmin(currentUser) || !selectedAdminUid) return;
    var text = (adminChatInput.value || "").trim();
    if (!text) return;

    updateThreadForUid(selectedAdminUid, function (thread) {
      thread.messages.push({
        senderRole: "admin",
        senderName: getDisplayName(currentUser),
        text: text,
        createdAt: nowLabel()
      });
      return thread;
    });

    adminChatInput.value = "";
    renderAdminDetail();
  }

  function updateRequestStatus(nextStatus) {
    if (!selectedAdminUid) return;
    var requests = getRequests().map(function (request) {
      if (String(request.uid) === String(selectedAdminUid)) {
        request.status = nextStatus;
      }
      return request;
    });
    saveRequests(requests);
    renderAll();
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
        videoNote.textContent = selectedVideoName ? ("Selected file: " + selectedVideoName) : "No file selected.";
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
    renderUserChat();
    renderMemberCustomization();
    renderAdminList();
  }

  function loadCurrentUser() {
    return fetch(pythonURI + "/api/id", {
      method: "GET",
      mode: "cors",
      cache: "default",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Origin": "client"
      }
    })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        currentUser = data && data.uid ? data : null;
        return loadServerMembershipState(currentUser).then(function (resolvedUser) {
          currentUser = resolvedUser && resolvedUser.uid ? resolvedUser : currentUser;
          renderAll();
        });
      })
      .catch(function () {
        currentUser = null;
        renderAll();
      });
  }

  attachEvents();
  loadCurrentUser();
})();