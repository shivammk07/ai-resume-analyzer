<%@ include file="header.jspf" %>
<section class="card">
  <h1>Resume &amp; Formal Bio-Data Creator (Java 17 · Offline)</h1>
  <p class="muted">Create an ATS-ready Resume or Formal Bio-Data with an optional profile photo, personal details, and signed declaration. Zero external APIs.</p>

  <form method="post" action="${pageContext.request.contextPath}/builder" enctype="multipart/form-data">
    <input type="hidden" name="csrfToken" value="<c:out value='${sessionScope.CAREERPULSE_CSRF_TOKEN}'/>" />

    <div class="grid-2">
      <div>
        <label for="fullName">Full Name</label>
        <input id="fullName" name="fullName" type="text" value="Aarav Sharma" required />
      </div>
      <div>
        <label for="headline">Headline / Target Role</label>
        <input id="headline" name="headline" type="text" value="Senior Java Backend Engineer" />
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" value="aarav.sharma@example.com" />
      </div>
      <div>
        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="text" value="+91 98765 43210" />
      </div>
      <div>
        <label for="location">Location</label>
        <input id="location" name="location" type="text" value="Bengaluru, India" />
      </div>
      <div>
        <label for="photoFile">Optional Profile Photo (JPG / PNG)</label>
        <input id="photoFile" name="photoFile" type="file" accept="image/png,image/jpeg,image/webp" />
      </div>
    </div>

    <div class="grid-2">
      <div>
        <label for="templateStyle">Template Style</label>
        <select id="templateStyle" name="templateStyle">
          <option value="EXECUTIVE_MODERN">Executive Modern</option>
          <option value="SIDEBAR_PRO">Sidebar Pro (2-Column CV)</option>
          <option value="CLASSIC_ATS">Classic ATS</option>
          <option value="FORMAL_BIODATA">Formal Bio-Data Sheet</option>
        </select>
      </div>
      <div>
        <label for="exportFormat">Export Action</label>
        <select id="exportFormat" name="exportFormat">
          <option value="doc">Download Microsoft Word (.doc)</option>
          <option value="html">Download Printable HTML / PDF View</option>
          <option value="txt">Download Plain Text (.txt)</option>
          <option value="preview">Preview ATS Readiness Score</option>
        </select>
      </div>
    </div>

    <label for="summary">Professional Summary / Career Objective</label>
    <textarea id="summary" name="summary" rows="3">Java 17 &amp; JDBC Backend Engineer with 5+ years delivering fault-tolerant microservices, cutting p99 latency by 58% at 99.98% uptime.</textarea>

    <label for="skills">Technical Skills (comma-separated)</label>
    <input id="skills" name="skills" type="text" value="Java 17, Jakarta EE, JDBC, MySQL, H2, Spring Boot, Maven, JUnit 5, Docker, REST APIs" />

    <div class="grid-2">
      <div>
        <label for="expRole">Recent Role</label>
        <input id="expRole" name="expRole" type="text" value="Senior Backend Software Engineer" />
      </div>
      <div>
        <label for="expCompany">Company &amp; Period</label>
        <input id="expCompany" name="expCompany" type="text" value="FinScale Cloud Systems" />
        <input name="expPeriod" type="hidden" value="2022 - Present" />
      </div>
    </div>

    <label for="expBullets">Experience Bullets (one per line, Google XYZ format)</label>
    <textarea id="expBullets" name="expBullets" rows="4">Architected Java 17 payment microservices processing 35,000+ TPS at 99.98% SLA uptime.
Optimized parameterized JDBC &amp; PostgreSQL queries, reducing p99 latency by 58%.
Automated Maven, Checkstyle, and JUnit 5 pipelines, cutting production defects by 47%.</textarea>

    <div class="grid-2">
      <div>
        <label for="eduDegree">Degree / Qualification</label>
        <input id="eduDegree" name="eduDegree" type="text" value="B.Tech Computer Science &amp; Engineering" />
      </div>
      <div>
        <label for="eduInstitution">University / Institution</label>
        <input id="eduInstitution" name="eduInstitution" type="text" value="National Institute of Technology" />
      </div>
    </div>

    <h3>Personal Bio-Data &amp; Declaration (Optional)</h3>
    <label><input type="checkbox" name="includeBioData" value="true" checked /> Include Personal Bio-Data Table &amp; Signed Declaration</label>
    <div class="grid-2">
      <div><label for="dateOfBirth">Date of Birth</label><input id="dateOfBirth" name="dateOfBirth" type="text" value="14 August 1998" /></div>
      <div><label for="nationality">Nationality</label><input id="nationality" name="nationality" type="text" value="Indian" /></div>
      <div><label for="fatherName">Father's / Guardian's Name</label><input id="fatherName" name="fatherName" type="text" value="Rajesh Sharma" /></div>
      <div><label for="languages">Languages Known</label><input id="languages" name="languages" type="text" value="English (Fluent), Hindi (Native)" /></div>
    </div>
    <label for="permanentAddress">Permanent Address</label>
    <input id="permanentAddress" name="permanentAddress" type="text" value="Bengaluru, Karnataka, India" />

    <div style="margin-top: 16px;">
      <button class="btn btn-primary" type="submit">Generate Resume / Bio-Data</button>
    </div>
  </form>

  <c:if test="${not empty atsScore}">
    <div style="margin-top: 20px; padding: 14px; border: 1px solid #334155; border-radius: 8px;">
      <strong>Live ATS Readiness Score:</strong> <c:out value="${atsScore}"/> / 100
      <pre style="white-space: pre-wrap; margin-top: 10px;"><c:out value="${renderedText}"/></pre>
    </div>
  </c:if>
</section>
<%@ include file="footer.jspf" %>
