<%@ include file="header.jspf" %>

<div class="panel">
  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
    <div>
      <h1 style="margin:0;">ATS Validation &amp; Benchmark Lab</h1>
      <p style="margin:4px 0 0; color:#94a3b8;">Evaluates the deterministic Core Java engine against 12 independently labeled resumes across 4 quality tiers.</p>
    </div>
    <form method="post" action="${pageContext.request.contextPath}/benchmark" style="margin:0;">
      <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.careerpulse_csrf_token}'/>" />
      <button class="btn btn-primary" type="submit">Re-run Validation Suite</button>
    </form>
  </div>

  <div class="grid-4" style="margin-top:20px;">
    <div class="panel" style="margin:0;">
      <div style="font-size:0.8rem; color:#94a3b8;">Mean Absolute Error (MAE)</div>
      <div class="mono" style="font-size:1.6rem; font-weight:700;"><c:out value="${summary.meanAbsoluteError}" /> pts</div>
    </div>
    <div class="panel" style="margin:0;">
      <div style="font-size:0.8rem; color:#94a3b8;">Band Accuracy</div>
      <div class="mono" style="font-size:1.6rem; font-weight:700;"><c:out value="${summary.bandAccuracyPct}" />%</div>
    </div>
    <div class="panel" style="margin:0;">
      <div style="font-size:0.8rem; color:#94a3b8;">Spearman Rank &rho;</div>
      <div class="mono" style="font-size:1.6rem; font-weight:700;"><c:out value="${summary.spearmanRho}" /></div>
    </div>
    <div class="panel" style="margin:0;">
      <div style="font-size:0.8rem; color:#94a3b8;">Latency (p50 / p95)</div>
      <div class="mono" style="font-size:1.4rem; font-weight:700;"><c:out value="${summary.p50LatencyMs}" /> / <c:out value="${summary.p95LatencyMs}" /> ms</div>
    </div>
  </div>
</div>

<div class="panel">
  <h2 style="margin-top:0;">Labeled Corpus Comparison (<c:out value="${summary.datasetSize}" /> Resumes)</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Profile</th>
        <th>Tier</th>
        <th class="num">Expected Band</th>
        <th class="num">Predicted</th>
        <th class="num">Abs Error</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <c:forEach var="res" items="${summary.results}">
        <tr>
          <td class="mono"><c:out value="${res.id}" /></td>
          <td><c:out value="${res.label}" /></td>
          <td><c:out value="${res.tier}" /></td>
          <td class="num mono"><c:out value="${res.minBand}" />–<c:out value="${res.maxBand}" /> (<c:out value="${res.expectedScore}" />)</td>
          <td class="num mono"><strong><c:out value="${res.predictedScore}" /></strong></td>
          <td class="num mono"><c:out value="${res.absoluteError}" /></td>
          <td class="${res.withinBand ? 'status-good' : 'status-critical'}">
            <c:out value="${res.withinBand ? 'PASS' : 'OUTSIDE BAND'}" />
          </td>
        </tr>
      </c:forEach>
    </tbody>
  </table>
</div>

<%@ include file="footer.jspf" %>
