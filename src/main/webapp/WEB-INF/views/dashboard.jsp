<%@ include file="header.jspf" %>

<div class="panel">
  <div class="meta-row">
    <span>Deterministic Core Java Engine</span>
    <span>&middot;</span>
    <span>JDBC Active Driver: <c:out value="${activeDb}" /></span>
    <span>&middot;</span>
    <span>Zero External API Key Required</span>
  </div>
  <h1 style="margin: 10px 0 8px;">Deterministic ATS Resume Analyzer</h1>
  <p style="color: #94a3b8; margin-top: 0;">
    Evaluate resume alignment across five weighted Core Java scoring criteria with automated PII masking and configurable retention TTL.
  </p>

  <c:if test="${not empty error}">
    <div class="alert-error"><c:out value="${error}" /></div>
  </c:if>

  <form method="post" action="${pageContext.request.contextPath}/analyze" enctype="multipart/form-data">
    <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />

    <div class="grid-2" style="margin-bottom: 16px;">
      <div>
        <label for="targetRole">Target Role</label>
        <input id="targetRole" type="text" name="targetRole" placeholder="e.g. Senior Java Backend Engineer" required />
      </div>
      <div>
        <label for="seniorityLevel">Seniority Level</label>
        <select id="seniorityLevel" name="seniorityLevel">
          <option value="Entry">Entry Level</option>
          <option value="Mid">Mid-Level</option>
          <option value="Senior" selected>Senior</option>
          <option value="Lead">Lead / Principal</option>
        </select>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <label for="jobDescription">Target Job Description</label>
      <textarea id="jobDescription" name="jobDescription" rows="3" placeholder="Paste target skills and requirements (e.g. Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, REST API)..."></textarea>
    </div>

    <div style="margin-bottom: 16px;">
      <label for="resumeFile">Upload Resume File (.txt / .md) or Paste Below</label>
      <input id="resumeFile" type="file" name="resumeFile" accept=".txt,.md" />
    </div>

    <div style="margin-bottom: 16px;">
      <label for="resumeText">Resume Plain Text</label>
      <textarea id="resumeText" name="resumeText" rows="10" placeholder="Paste full resume text including Summary, Experience bullets, Skills, and Education..."></textarea>
    </div>

    <div class="grid-2" style="margin-bottom: 20px;">
      <div>
        <label for="engineMode">Scoring Engine Mode</label>
        <select id="engineMode" name="engineMode">
          <option value="DETERMINISTIC_LOCAL" selected>Deterministic Local Engine (Offline · Zero API Key)</option>
        </select>
      </div>
      <div>
        <label for="retentionPolicy">Data Retention Policy (Privacy TTL)</label>
        <select id="retentionPolicy" name="retentionPolicy">
          <option value="EPHEMERAL">Do Not Store (Ephemeral Session Only)</option>
          <option value="HOURS_24" selected>Store Redacted Copy for 24 Hours</option>
          <option value="DAYS_7">Store Redacted Copy for 7 Days</option>
        </select>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display:flex; align-items:center; gap:8px; font-weight:500;">
        <input type="checkbox" name="redactPii" value="true" checked />
        Automatically mask PII (email, phone, SSN, street address, DOB) before analysis and JDBC persistence
      </label>
    </div>

    <button class="btn btn-primary" type="submit">Run ATS Analysis</button>
  </form>
</div>

<%@ include file="footer.jspf" %>
