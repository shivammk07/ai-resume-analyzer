<%@ include file="header.jspf" %>

<div class="panel">
  <h1 style="margin-top:0;">Privacy, Retention &amp; Data Protection Controls</h1>
  <p style="color:#94a3b8;">
    Resumes frequently contain sensitive Personal Identifiable Information (PII). CareerPulse enforces automated masking, owner-scoped access checks, and configurable retention TTL.
  </p>

  <ul>
    <li><strong>Automated PII Redaction</strong>: Emails, phone numbers, SSNs, street addresses, and DOB fields are replaced with neutral placeholders before database storage or optional AI calls.</li>
    <li><strong>Retention Governance</strong>: Users choose between Ephemeral (zero database write), 24-Hour TTL, or 7-Day TTL. Expired records are automatically deleted via JDBC.</li>
    <li><strong>Access Control &amp; CSRF</strong>: All history views and delete operations verify session <code>user_id</code> ownership and CSRF tokens.</li>
  </ul>

  <div style="display:flex; gap:12px; margin-top:18px; flex-wrap:wrap;">
    <form method="post" action="${pageContext.request.contextPath}/privacy" style="margin:0;">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <input type="hidden" name="action" value="cleanupExpired" />
      <button class="btn btn-secondary" type="submit">Run Expired TTL Cleanup</button>
    </form>
    <form method="post" action="${pageContext.request.contextPath}/privacy" style="margin:0;">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <input type="hidden" name="action" value="purgeAll" />
      <button class="btn btn-danger" type="submit">Permanently Purge All My Data</button>
    </form>
  </div>
</div>

<div class="panel">
  <h2 style="margin-top:0;">Recent Privacy &amp; Access Audit Log</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Action</th>
        <th>Resource</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      <c:forEach var="log" items="${auditLogs}">
        <tr>
          <td class="mono"><c:out value="${log.createdAt}" /></td>
          <td class="mono"><c:out value="${log.action}" /></td>
          <td class="mono"><c:out value="${log.resourceId}" /></td>
          <td><c:out value="${log.details}" /></td>
        </tr>
      </c:forEach>
    </tbody>
  </table>
</div>

<%@ include file="footer.jspf" %>
