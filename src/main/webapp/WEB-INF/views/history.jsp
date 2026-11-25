<%@ include file="header.jspf" %>

<div class="panel">
  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
    <div>
      <h1 style="margin:0;">Persisted JDBC Audit History</h1>
      <p style="margin:4px 0 0; color:#94a3b8;">Owner-scoped records stored in relational SQL with automated TTL expiry enforcement.</p>
    </div>
    <form method="post" action="${pageContext.request.contextPath}/privacy">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <input type="hidden" name="action" value="purgeAll" />
      <button class="btn btn-danger" type="submit">Purge All My Data</button>
    </form>
  </div>

  <c:choose>
    <c:when test="${empty reports}">
      <p style="margin-top:20px; color:#94a3b8;">No persisted reports yet. Run an analysis with 24-hour or 7-day retention to store a redacted audit record.</p>
      <a class="btn btn-primary" href="${pageContext.request.contextPath}/analyze">Run New Analysis</a>
    </c:when>
    <c:otherwise>
      <table style="margin-top:16px;">
        <thead>
          <tr>
            <th>File</th>
            <th>Target Role</th>
            <th>Engine</th>
            <th class="num">Score</th>
            <th class="num">PII Masked</th>
            <th>Retention</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <c:forEach var="r" items="${reports}">
            <tr>
              <td><c:out value="${r.fileName}" /></td>
              <td><c:out value="${r.targetRole}" /></td>
              <td><c:out value="${r.engineMode}" /></td>
              <td class="num mono"><c:out value="${r.overallScore}" />/100</td>
              <td class="num mono"><c:out value="${r.piiItemsMasked}" /></td>
              <td><c:out value="${r.retentionPolicy}" /></td>
              <td style="display:flex; gap:8px;">
                <a class="btn btn-secondary" href="${pageContext.request.contextPath}/history?id=<c:out value='${r.id}'/>">View</a>
                <form method="post" action="${pageContext.request.contextPath}/privacy" style="margin:0;">
                  <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
                  <input type="hidden" name="action" value="deleteOne" />
                  <input type="hidden" name="reportId" value="<c:out value='${r.id}'/>" />
                  <button class="btn btn-danger" type="submit">Delete</button>
                </form>
              </td>
            </tr>
          </c:forEach>
        </tbody>
      </table>
    </c:otherwise>
  </c:choose>
</div>

<%@ include file="footer.jspf" %>
