<%@ include file="header.jspf" %>

<div class="panel">
  <div class="meta-row">
    <span>Engine: <c:out value="${report.engineMode.displayName}" /></span>
    <span>&middot;</span>
    <span class="mono">Latency: <c:out value="${report.analysisTimeMs}" /> ms</span>
    <span>&middot;</span>
    <span class="mono">PII Masked: <c:out value="${report.piiItemsMasked}" /></span>
    <span>&middot;</span>
    <span>Retention: <c:out value="${report.retentionPolicy.label}" /></span>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:16px; margin-top:12px;">
    <div>
      <h1 style="margin:0;">Target Role: <c:out value="${report.targetRole}" /></h1>
      <p style="margin:4px 0 0; color:#94a3b8;">File: <c:out value="${report.fileName}" /></p>
    </div>
    <div style="text-align:right;">
      <div class="mono" style="font-size:2.4rem; font-weight:800;"><c:out value="${report.overallScore}" /> / 100</div>
      <div style="color:#a5b4fc; font-weight:600;"><c:out value="${report.scoreLabel}" /></div>
    </div>
  </div>

  <div class="disclaimer" style="margin-top: 18px;">
    <strong>Validation Scope Disclaimer:</strong> <c:out value="${report.disclaimer}" />
  </div>
</div>

<div class="panel">
  <h2 style="margin-top:0;">Five Weighted ATS Scoring Dimensions</h2>
  <c:forEach var="entry" items="${report.categoryScores}">
    <div style="margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
        <span><strong><c:out value="${entry.value.criterionName}" /></strong></span>
        <span class="mono status-<c:out value='${entry.value.status}'/>"><c:out value="${entry.value.score}" /> / 100</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: <c:out value='${entry.value.score}'/>%;"></div>
      </div>
      <c:if test="${not empty entry.value.feedback}">
        <div style="font-size:0.82rem; color:#94a3b8; margin-top:4px;"><c:out value="${entry.value.feedback}" /></div>
      </c:if>
    </div>
  </c:forEach>
</div>

<div class="grid-2">
  <div class="panel">
    <h3 style="margin-top:0;">Prioritized Fix Recommendations</h3>
    <c:forEach var="fix" items="${report.prioritizedFixes}">
      <div style="padding:10px 0; border-bottom:1px solid #1e293b;">
        <div style="font-weight:600;">[<c:out value="${fix.priority}" />] <c:out value="${fix.title}" /></div>
        <div style="font-size:0.84rem; color:#94a3b8;"><c:out value="${fix.issue}" /></div>
        <div style="font-size:0.84rem; color:#cbd5e1; margin-top:4px;">Action: <c:out value="${fix.recommendation}" /></div>
      </div>
    </c:forEach>
  </div>

  <div class="panel">
    <h3 style="margin-top:0;">Keyword Alignment</h3>
    <p><strong>Matched Keywords:</strong>
      <c:forEach var="kw" items="${report.matchedKeywords}" varStatus="st">
        <c:out value="${kw}" /><c:if test="${!st.last}">, </c:if>
      </c:forEach>
    </p>
    <p><strong>Missing Keywords:</strong>
      <c:forEach var="kw" items="${report.missingKeywords}" varStatus="st">
        <c:out value="${kw}" /><c:if test="${!st.last}">, </c:if>
      </c:forEach>
    </p>
  </div>
</div>

<%@ include file="footer.jspf" %>
