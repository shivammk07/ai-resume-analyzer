<%@ include file="header.jspf" %>

<div class="grid-2">
  <div class="panel">
    <h2 style="margin-top:0;">Sign In</h2>
    <c:if test="${not empty error}">
      <div class="alert-error"><c:out value="${error}" /></div>
    </c:if>
    <form method="post" action="${pageContext.request.contextPath}/auth">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <input type="hidden" name="action" value="login" />
      <div style="margin-bottom:12px;">
        <label for="loginEmail">Email</label>
        <input id="loginEmail" type="email" name="email" required />
      </div>
      <div style="margin-bottom:16px;">
        <label for="loginPassword">Password</label>
        <input id="loginPassword" type="password" name="password" minlength="6" required />
      </div>
      <button class="btn btn-primary" type="submit">Sign In</button>
    </form>
  </div>

  <div class="panel">
    <h2 style="margin-top:0;">Register Candidate Account</h2>
    <form method="post" action="${pageContext.request.contextPath}/auth">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <input type="hidden" name="action" value="register" />
      <div style="margin-bottom:12px;">
        <label for="regName">Display Name</label>
        <input id="regName" type="text" name="displayName" required />
      </div>
      <div style="margin-bottom:12px;">
        <label for="regEmail">Email</label>
        <input id="regEmail" type="email" name="email" required />
      </div>
      <div style="margin-bottom:16px;">
        <label for="regPassword">Password (min 6 characters, PBKDF2-HMAC-SHA256 hashed)</label>
        <input id="regPassword" type="password" name="password" minlength="6" required />
      </div>
      <button class="btn btn-secondary" type="submit">Create Account</button>
    </form>
  </div>
</div>

<%@ include file="footer.jspf" %>
