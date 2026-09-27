from typing import List, Dict, Any, Optional
import re
from app.ai.base import (
    LLMProvider,
    ChatMessage,
    AIResponse,
    IntentClassification,
    CallSummaryOutput,
)
from app.models.entities import CallCategoryEnum, UrgencyLevelEnum

class MockLLMProvider(LLMProvider):
    """
    Offline, deterministic, high-fidelity AI provider for real-time voice conversation.
    Acts as AURA, an AI representative speaking on behalf of the user.
    Generates natural, voice-friendly, concise spoken responses (1-3 sentences).
    Strictly adheres to approved resume information.
    """

    async def generate_response(
        self,
        messages: List[ChatMessage],
        call_context: Optional[Dict[str, Any]] = None,
        professional_profile: Optional[Dict[str, Any]] = None
    ) -> AIResponse:
        user_messages = [m.content for m in messages if m.role == "user"]
        latest_query = user_messages[-1].strip() if user_messages else ""
        text_lower = latest_query.lower()

        context = call_context or {}
        user_name = context.get("user_name", "Arjun Sharma")
        first_name = user_name.split()[0] if user_name else "Arjun"
        category_hint = context.get("category", CallCategoryEnum.UNKNOWN.value)

        # 0. Empty or unintelligible speech check (Rule 12)
        if not latest_query or len(latest_query.split()) == 0:
            return AIResponse(
                reply_text="Sorry, I didn't catch that. Could you please repeat your question?",
                detected_intent=CallCategoryEnum.NORMAL,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="UNCERTAIN",
                confidence_level="LOW",
                topic="Audio Inaudible"
            )

        # 1. Emergency Detection
        is_emergency_text = bool(re.search(
            r'\b(hospital|emergency|ambulance|car crash|accident|collision|admitted|urgent authorization|icu|police|cardiac|dying)\b',
            text_lower
        ))
        if is_emergency_text or category_hint == CallCategoryEnum.EMERGENCY.value:
            reply = (
                f"I understand this is a serious emergency. As an AI representative, I am dispatching a high-priority "
                f"emergency alert directly to {user_name}'s active devices right now. Please provide any direct callback number."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.EMERGENCY,
                detected_urgency=UrgencyLevelEnum.POTENTIAL_EMERGENCY,
                is_emergency=True,
                requires_user_alert=True,
                interview_grounded=False,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Emergency Crisis"
            )

        # 2. Spam / Robocall Handling
        spam_indicators = [
            "warranty", "timeshare", "unsecured debt", "lower your rate", "lottery",
            "free cruise", "social security administration has suspended", "auto insurance offer"
        ]
        if any(ind in text_lower for ind in spam_indicators) or category_hint == CallCategoryEnum.SPAM.value:
            reply = (
                f"The person I am representing does not accept unsolicited marketing offers. "
                f"Please remove this number from your contact list. Thank you."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.SPAM,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=False,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Spam Call"
            )

        # 3. PERSONAL / PRIVATE QUESTIONS (Rule 2)
        # Home address, phone number, personal email, family details, passwords, financial info, relationships, salary
        private_terms = [
            "address", "home address", "where do they live", "where does he live", "where does she live",
            "phone number", "cell phone", "mobile number", "contact number", "call them directly",
            "personal email", "private email", "gmail",
            "family", "parents", "mother", "father", "spouse", "married", "relationship", "dating", "children",
            "password", "passcode", "pin code", "login", "credentials", "otp", "secret key",
            "bank", "bank account", "credit card", "debit card", "finance", "financial",
            "salary", "compensation", "package", "how much do they make", "how much does he make", "current ctc", "expected ctc", "pay rate"
        ]
        if any(term in text_lower for term in private_terms):
            if any(term in text_lower for term in ["salary", "compensation", "package", "pay rate", "ctc"]):
                reply = "I’m sorry, salary and compensation details are confidential and private. I don’t have permission to share that information. I’ll ask the person I’m representing to call you back regarding that."
            else:
                reply = "I’m sorry, I don’t have permission to share that information. I’ll ask the person I’m representing to call you back regarding that."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                grounding_notes="Withheld confidential/private information per privacy policy.",
                classification_type="PRIVATE",
                confidence_level="HIGH",
                topic="Personal / Private Information"
            )

        # 4. UNRELATED QUESTIONS (Rule 3)
        # Topics unrelated to professional resume / interview (movie, sports, weather, investment, jokes, politics)
        unrelated_terms = [
            "favorite movie", "favourite movie", "watch movie", "favorite song", "favorite music",
            "favorite food", "favorite color", "favourite color", "favorite game",
            "investment advice", "invest in stocks", "crypto investment", "bitcoin",
            "weather", "is it raining", "temperature today", "climate",
            "tell me a joke", "make me laugh",
            "politics", "election", "who will win the election", "president"
        ]
        if any(term in text_lower for term in unrelated_terms):
            if any(term in text_lower for term in ["investment", "advice", "stocks"]):
                reply = "That’s outside what I’m able to discuss on their behalf. I’ll ask the person I’m representing to get back to you."
            else:
                reply = "That’s something I’d rather have the person I’m representing answer personally. I’ll ask them to call you back."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.NORMAL,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=False,
                grounding_notes="Declined unrelated query outside professional scope.",
                classification_type="UNRELATED",
                confidence_level="HIGH",
                topic="Unrelated Subject"
            )

        # 5. Extract and Index Approved Resume Information
        profile = professional_profile or {}
        raw_resume = profile.get("resume_text") or profile.get("raw_resume") or ""
        resume_lower = raw_resume.lower()

        # Extract Candidate Name from resume header or fallback to user_name
        candidate_name = user_name
        resume_lines = [l.strip() for l in raw_resume.splitlines() if l.strip()]
        if resume_lines:
            first_line = resume_lines[0].replace("#", "").strip()
            if len(first_line) < 40 and not any(k in first_line.lower() for k in ["resume", "summary", "profile", "contact", "developer", "engineer"]):
                candidate_name = first_line.split("|")[0].strip()

        # Section extraction using markdown headers or category lines
        sections: Dict[str, str] = {}
        current_sec = "HEADER"
        sec_lines: List[str] = []
        header_pattern = re.compile(
            r'^(?:#+\s*)?(SUMMARY|PROFESSIONAL SUMMARY|ABOUT|PROFILE|TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|PROFICIENCIES|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|WORK HISTORY|INTERNSHIPS|PROJECTS|KEY PROJECTS|ACADEMIC PROJECTS|PERSONAL PROJECTS|EDUCATION|ACADEMIC BACKGROUND|ACADEMIC HISTORY|QUALIFICATIONS|CERTIFICATIONS|CERTIFICATES|CREDENTIALS|ACHIEVEMENTS|ACCOMPLISHMENTS|AWARDS|SOFT SKILLS|INTERESTS)\b.*',
            re.IGNORECASE
        )
        for line in raw_resume.splitlines():
            trimmed = line.strip()
            m = header_pattern.match(trimmed)
            if m and len(trimmed) < 55 and not trimmed.startswith('•') and not trimmed.startswith('*') and not trimmed.startswith('-'):
                if sec_lines:
                    sections[current_sec] = "\n".join(sec_lines).strip()
                sec_tag = m.group(1).upper()
                if any(k in sec_tag for k in ["SUMMARY", "ABOUT", "PROFILE"]): current_sec = "SUMMARY"
                elif any(k in sec_tag for k in ["SKILL", "COMPETENC", "PROFICIENC"]): current_sec = "SKILLS"
                elif any(k in sec_tag for k in ["EXPERIENCE", "EMPLOYMENT", "WORK HISTORY", "INTERNSHIP"]): current_sec = "EXPERIENCE"
                elif "PROJECT" in sec_tag: current_sec = "PROJECTS"
                elif any(k in sec_tag for k in ["EDUCATION", "ACADEMIC", "QUALIFICATION"]): current_sec = "EDUCATION"
                elif any(k in sec_tag for k in ["CERTIFICATION", "CERTIFICATE", "CREDENTIAL"]): current_sec = "CERTIFICATIONS"
                elif any(k in sec_tag for k in ["ACHIEVEMENT", "ACCOMPLISHMENT", "AWARD"]): current_sec = "ACHIEVEMENTS"
                else: current_sec = sec_tag
                sec_lines = []
            else:
                sec_lines.append(line)
        if sec_lines:
            sections[current_sec] = "\n".join(sec_lines).strip()

        # Extract Summary (prefer uploaded resume sections over cached profile)
        summary = sections.get("SUMMARY", "") or profile.get("summary", "")
        summary_clean = " ".join(summary.replace("---", "").split())

        # Extract Skills (prefer uploaded resume sections over cached profile)
        skills_list: List[str] = []
        if "SKILLS" in sections and sections["SKILLS"].strip():
            for sk_line in sections["SKILLS"].splitlines():
                if ":" in sk_line:
                    _, rest = sk_line.split(":", 1)
                    skills_list.extend([s.replace("*", "").strip() for s in re.split(r'[,•|/;\n]+', rest) if len(s.strip()) > 1])
                else:
                    skills_list.extend([s.replace("*", "").strip() for s in re.split(r'[,•|/;\n]+', sk_line) if len(s.strip()) > 1])
        elif profile.get("skills"):
            p_sk = profile.get("skills")
            if isinstance(p_sk, list):
                skills_list.extend(p_sk)
            elif isinstance(p_sk, str):
                skills_list.extend([s.strip() for s in re.split(r'[,•|/;\n]+', p_sk) if s.strip()])

        if not skills_list:
            skills_list = ["Python", "Java", "JavaScript", "SQL", "FastAPI", "React", "PostgreSQL", "Docker", "AWS"]

        # Parse structured experience items from uploaded resume
        parsed_experience: List[Dict[str, Any]] = []
        if profile.get("work_experience") and isinstance(profile["work_experience"], list):
            for we in profile["work_experience"]:
                parsed_experience.append({
                    "title": we.get("role", "Software Engineer"),
                    "company": we.get("company", ""),
                    "dates": we.get("dates", ""),
                    "title_company": f"{we.get('role', '')} at {we.get('company', '')} ({we.get('dates', '')})".strip(),
                    "highlights": we.get("highlights", [])
                })
        elif "EXPERIENCE" in sections and sections["EXPERIENCE"].strip():
            curr_job: Optional[Dict[str, Any]] = None
            for eline in sections["EXPERIENCE"].splitlines():
                eline_s = eline.strip()
                if not eline_s or eline_s.startswith("---"): continue
                is_bullet = (not eline_s[0].isalnum() and eline_s[0] not in ('(', '[')) or eline.startswith(('  ', '\t')) or bool(re.match(r'^\d+[.)]\s*', eline_s))
                if is_bullet:
                    hl = re.sub(r'^(?:[^\w\s(]|#+|\d+[.)])+\s*', '', eline_s).strip()
                    if curr_job and hl:
                        curr_job["highlights"].append(hl)
                else:
                    if curr_job:
                        parsed_experience.append(curr_job)
                    parts = re.split(r'[—–\-|,@]', eline_s)
                    role = parts[0].strip() if len(parts) > 1 else eline_s
                    comp = parts[1].strip() if len(parts) > 1 else ""
                    curr_job = {
                        "title": role,
                        "company": comp,
                        "dates": "",
                        "title_company": eline_s,
                        "highlights": []
                    }
            if curr_job:
                parsed_experience.append(curr_job)

        # Parse structured project items from uploaded resume
        parsed_projects: List[Dict[str, Any]] = []
        if profile.get("projects") and isinstance(profile["projects"], list):
            for pr in profile["projects"]:
                parsed_projects.append({
                    "name": pr.get("name", "Project"),
                    "technologies": pr.get("technologies", []),
                    "highlights": [pr.get("highlights", pr.get("description", ""))] if pr.get("highlights") or pr.get("description") else []
                })
        elif "PROJECTS" in sections and sections["PROJECTS"].strip():
            curr_proj: Optional[Dict[str, Any]] = None
            for pline in sections["PROJECTS"].splitlines():
                pline_s = pline.strip()
                if not pline_s or pline_s.startswith("---"): continue
                is_bullet = (not pline_s[0].isalnum() and pline_s[0] not in ('(', '[')) or pline.startswith(('  ', '\t')) or bool(re.match(r'^\d+[.)]\s*', pline_s))
                if is_bullet:
                    hl = re.sub(r'^(?:[^\w\s(]|#+|\d+[.)])+\s*', '', pline_s).strip()
                    if curr_proj and hl:
                        curr_proj["highlights"].append(hl)
                else:
                    if curr_proj:
                        parsed_projects.append(curr_proj)
                    curr_proj = {"name": pline_s, "technologies": [], "highlights": []}
            if curr_proj:
                parsed_projects.append(curr_proj)

        # Format helpers
        primary_skills_str = ", ".join(skills_list[:7]) if skills_list else "Python, Java, FastAPI, PostgreSQL, and Docker"

        # 6. CONVERSATION MEMORY & MULTI-TURN CONTEXT RESOLUTION (Rule 9)
        last_assistant_turn = ""
        prev_assistant_messages = [m.content.lower() for m in messages if m.role == "assistant"]
        if prev_assistant_messages:
            last_assistant_turn = prev_assistant_messages[-1]

        # Handle contextual pronouns ("there", "in that role", "in that project", "what did they do there")
        if any(k in text_lower for k in ["work on there", "do there", "responsibilities there", "in that role", "at that company"]):
            if "xyz technologies" in last_assistant_turn or "intern" in last_assistant_turn or "software engineering intern" in last_assistant_turn:
                reply = (
                    "At XYZ Technologies, they developed and maintained REST APIs using Python and FastAPI, "
                    "designed database models and queries with PostgreSQL, and optimized response times with caching."
                )
                return AIResponse(
                    reply_text=reply,
                    detected_intent=CallCategoryEnum.INTERVIEW,
                    detected_urgency=UrgencyLevelEnum.IMPORTANT,
                    is_emergency=False,
                    requires_user_alert=False,
                    interview_grounded=True,
                    classification_type="ANSWERED",
                    confidence_level="HIGH",
                    topic="Internship Responsibilities (Contextual)"
                )

        if any(k in text_lower for k in ["technologies did they use", "tech stack in that", "built with", "how did they build it"]) and (
            "interview platform" in last_assistant_turn or "coding judge" in last_assistant_turn or "project" in last_assistant_turn
        ):
            reply = (
                "For the AI-Powered Interview Platform, they utilized Python, FastAPI, React, PostgreSQL, and Docker. "
                "For the Online Coding Judge, they implemented isolated Docker containers for safe program execution."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Project Technologies (Contextual)"
            )

        # 7. GREETING / REPRESENTATIVE IDENTITY (Rule 8)
        if re.search(r'\b(hello|hi|hey|who is this|who are you|speaking with|speaking to|am i speaking|is this)\b', text_lower) and len(text_lower.split()) <= 6:
            reply = (
                f"Hello! I am AURA, an AI representative assisting on behalf of {candidate_name}. "
                f"I can answer questions regarding their skills, projects, experience, and qualifications."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.NORMAL,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Greeting & Identity"
            )

        # 8. SPECIFIC COMPANY / INTERNSHIP CHECK (High Priority)
        # Check if caller asks specifically about a company or internship they completed
        if any(k in text_lower for k in ["xyz", "xyz technologies", "intern at xyz", "software engineering intern"]):
            reply = (
                "At XYZ Technologies in Hyderabad, they served as a Software Engineering Intern from January to June 2026. "
                "They developed and maintained REST APIs with Python and FastAPI, designed PostgreSQL tables and queries, "
                "and optimized response times through indexing and caching."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="XYZ Technologies Internship"
            )

        if "cognitive dynamics" in text_lower:
            reply = (
                "At Cognitive Dynamics, they served as Staff AI Engineer, architecting high-throughput agentic workflows "
                "serving 10 million daily events and reducing conversational latency by 45% using streaming WebSockets."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Cognitive Dynamics Experience"
            )

        if "cloudnova" in text_lower:
            reply = (
                "At CloudNova Systems, they served as Senior Backend Engineer, designing distributed data pipelines "
                "handling 50,000 requests per second and containerizing services with FastAPI on AWS."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="CloudNova Experience"
            )

        # 9. SPECIFIC PROJECT CHECK (High Priority)
        # Check if caller asks specifically about a project
        if any(k in text_lower for k in ["coding judge", "online judge", "code execution"]):
            reply = (
                "The Online Coding Judge project allows users to submit programs and runs them inside isolated Docker containers "
                "with memory limits, execution timeouts, and automated test case evaluation using FastAPI and PostgreSQL."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Online Coding Judge Project"
            )

        if any(k in text_lower for k in ["interview platform", "ai interview", "ai-powered"]):
            reply = (
                "The AI-Powered Interview Platform was built with Python, FastAPI, React, and PostgreSQL. "
                "It dynamically generates interview questions and provides automated candidate evaluations in a Dockerized environment."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="AI Interview Platform Project"
            )

        if any(k in text_lower for k in ["e-commerce", "ecommerce", "shopping cart"]):
            reply = (
                "The E-Commerce Backend API was developed with Java and Spring Boot, utilizing MySQL and Redis caching. "
                "It implements JWT authentication, cart management, and optimized database indexing."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="E-Commerce Project"
            )

        if any(k in text_lower for k in ["nexusstream", "voice orchestrator"]):
            reply = (
                "The NexusStream Agent is an ultra-low latency conversational voice orchestrator built with Python, "
                "FastAPI, Kafka, and WebSockets, handling over 50,000 events per second."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="NexusStream Project"
            )

        # 10. SPECIFIC TECH EXPERIENCE CHECK
        # Check if caller asks about experience with or knowledge of a specific skill/tool
        common_tech_patterns = [
            ("python", "Python for backend development, REST API design, data structures, and automation"),
            ("fastapi", "FastAPI for building high-performance asynchronous REST microservices"),
            ("java", "Java and Spring Boot for backend APIs, database connectivity, and object-oriented design"),
            ("sql", "SQL and relational databases including PostgreSQL and MySQL for query optimization"),
            ("postgres", "PostgreSQL for database schema design, indexing, and transactional data storage"),
            ("docker", "Docker for containerizing backend services and isolated code execution environments"),
            ("aws", "AWS cloud services as certified by their AWS Certified Cloud Practitioner credential"),
            ("react", "React for building interactive frontend interfaces and consuming REST APIs"),
            ("redis", "Redis for high-speed query acceleration and in-memory caching"),
            ("git", "Git and GitHub for version control, code reviews, and collaborative development"),
            ("mongodb", "MongoDB for document database storage and flexible schemas"),
            ("mysql", "MySQL for relational database management and transactional data"),
            ("node", "Node.js for backend scripting and microservices"),
            ("rest", "REST API architecture, routing, authentication, and endpoint design"),
            ("dsa", "Data structures and algorithms, with over 350 coding problems solved"),
            ("spring", "Spring Boot for enterprise Java microservices and REST endpoints"),
            ("kafka", "Kafka for high-throughput streaming and event pipelines"),
            ("pytorch", "PyTorch for machine learning and neural model inference"),
            ("kubernetes", "Kubernetes for container orchestration and cluster scaling")
        ]

        # Check if caller queries about a technology
        for tech_key, tech_desc in common_tech_patterns:
            if re.search(rf'\b{tech_key}\b', text_lower):
                # Verify if this technology is present in the candidate's resume
                if tech_key in resume_lower or any(tech_key in s.lower() for s in skills_list):
                    reply = f"Yes. According to their resume, the person I'm representing has hands-on experience using {tech_desc}."
                    return AIResponse(
                        reply_text=reply,
                        detected_intent=CallCategoryEnum.INTERVIEW,
                        detected_urgency=UrgencyLevelEnum.IMPORTANT,
                        is_emergency=False,
                        requires_user_alert=False,
                        interview_grounded=True,
                        classification_type="ANSWERED",
                        confidence_level="HIGH",
                        topic=f"Verified Skill: {tech_key.capitalize()}"
                    )
                else:
                    # Explicitly not found in approved resume -> Rule 4
                    reply = "I’m not completely sure about that as it is not listed on their resume, so I’ll ask the person I’m representing to get back to you."
                    return AIResponse(
                        reply_text=reply,
                        detected_intent=CallCategoryEnum.INTERVIEW,
                        detected_urgency=UrgencyLevelEnum.NORMAL,
                        is_emergency=False,
                        requires_user_alert=False,
                        interview_grounded=False,
                        grounding_notes=f"Skill '{tech_key}' not found in approved resume information.",
                        classification_type="UNCERTAIN",
                        confidence_level="LOW",
                        topic="Unverified Skill Experience"
                    )

        # Check unverified / unapproved technologies
        unverified_skills = [
            "rust", "ruby", "c#", "swift", "kotlin", "php", "scala",
            "terraform", "graphql", "solidity", "blockchain", "hadoop", "spark",
            "vue", "angular", "flutter", "dart", "salesforce", "julia", "perl"
        ]
        if any(unv in text_lower for unv in unverified_skills):
            matched_unv = next((u for u in unverified_skills if u in text_lower), "that")
            if matched_unv not in resume_lower:
                reply = "I’m not completely sure about that as it is not listed on their resume, so I’ll ask the person I’m representing to get back to you."
                return AIResponse(
                    reply_text=reply,
                    detected_intent=CallCategoryEnum.INTERVIEW,
                    detected_urgency=UrgencyLevelEnum.NORMAL,
                    is_emergency=False,
                    requires_user_alert=False,
                    interview_grounded=False,
                    grounding_notes=f"Skill '{matched_unv}' not found in approved resume information.",
                    classification_type="UNCERTAIN",
                    confidence_level="LOW",
                    topic="Uncertain / Unverified Skill"
                )

        # 11. GENERAL TECHNICAL SKILLS & PROGRAMMING LANGUAGES
        if any(k in text_lower for k in ["technical skill", "skills", "tech stack", "tools", "competencies", "what do you know", "what does he know", "what do they know", "proficient in"]) or (
            ("technologies" in text_lower or "technology" in text_lower) and "xyz" not in text_lower and "company" not in text_lower
        ):
            reply = (
                f"The person I'm representing has experience with {primary_skills_str}, "
                f"along with database design, system architecture, and building scalable backend applications."
            )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                grounding_notes="Grounded on approved resume skills.",
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Technical Skills"
            )

        if any(k in text_lower for k in ["programming language", "coding language", "languages do they know", "languages does he know", "languages"]):
            langs = [s for s in skills_list if s.lower() in ["python", "java", "javascript", "typescript", "c++", "c#", "sql", "go", "ruby", "rust"]]
            if not langs:
                langs = ["Python", "Java", "JavaScript", "SQL"]
            langs_str = ", ".join(langs[:5])
            reply = f"According to their resume, they are proficient in programming languages including {langs_str}."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Programming Languages"
            )

        # 12. GENERAL PROJECTS
        if any(k in text_lower for k in ["project", "projects", "portfolio", "what have they built", "what did they build", "applications"]):
            if parsed_projects:
                p1 = parsed_projects[0]
                hl1 = f", which {p1['highlights'][0].rstrip('.')}" if p1["highlights"] else ""
                ans = f"Key projects on their resume include {p1['name']}{hl1}."
                if len(parsed_projects) > 1:
                    p2 = parsed_projects[1]
                    hl2 = f", which {p2['highlights'][0].rstrip('.')}" if p2["highlights"] else ""
                    ans += f" They also developed {p2['name']}{hl2}."
                return AIResponse(
                    reply_text=ans,
                    detected_intent=CallCategoryEnum.INTERVIEW,
                    detected_urgency=UrgencyLevelEnum.IMPORTANT,
                    is_emergency=False,
                    requires_user_alert=False,
                    interview_grounded=True,
                    grounding_notes="Grounded dynamically on approved resume projects.",
                    classification_type="ANSWERED",
                    confidence_level="HIGH",
                    topic="Projects"
                )
            elif "interview platform" in resume_lower or "coding judge" in resume_lower:
                reply = (
                    "Key projects on their resume include an AI-Powered Interview Platform built with FastAPI and React, "
                    "an Online Coding Judge with secure Docker sandboxing, and an E-Commerce Backend API using Java and Spring Boot."
                )
            elif "nexusstream" in resume_lower:
                reply = (
                    "Key projects on their resume include the NexusStream Agent, an ultra-low latency voice orchestrator, "
                    "the AURA Call Assistant, and a Distributed RAG Engine indexing over 10 million documents."
                )
            else:
                reply = (
                    f"According to the resume, key projects include applications built using {primary_skills_str}, "
                    f"focusing on backend microservices, database models, and containerized deployments."
                )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                grounding_notes="Grounded on approved resume projects.",
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Projects"
            )

        # 13. GENERAL WORK EXPERIENCE & INTERNSHIPS
        if any(k in text_lower for k in ["internship", "intern", "where did they intern", "where did he intern"]):
            intern_items = [e for e in parsed_experience if "intern" in (e.get("title", "") + e.get("title_company", "")).lower()]
            if intern_items:
                i1 = intern_items[0]
                hl = f", where they {i1['highlights'][0].rstrip('.')}" if i1["highlights"] else ""
                reply = f"According to their resume, they completed an internship as {i1['title_company'].rstrip('.')}{hl}."
            elif "xyz technologies" in resume_lower:
                reply = (
                    "According to the resume, they completed a Software Engineering Internship at XYZ Technologies in Hyderabad, "
                    "developing and maintaining REST APIs using Python and FastAPI and optimizing database performance."
                )
            else:
                reply = "According to their resume, they have completed practical engineering internships focusing on backend development."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                grounding_notes="Grounded on internship experience.",
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Internship Experience"
            )

        if any(k in text_lower for k in ["work experience", "where have they worked", "employment history", "career background", "past roles", "prior experience", "experience"]):
            if parsed_experience:
                p1 = parsed_experience[0]
                p1_desc = p1["title_company"].rstrip(".")
                hl = f", where they {p1['highlights'][0].rstrip('.')}" if p1["highlights"] else ""
                ans = f"The person I'm representing worked as a {p1_desc}{hl}."
                if len(parsed_experience) > 1:
                    p2 = parsed_experience[1]
                    ans += f" Prior to that, they were a {p2['title_company'].rstrip('.')}."
                return AIResponse(
                    reply_text=ans,
                    detected_intent=CallCategoryEnum.INTERVIEW,
                    detected_urgency=UrgencyLevelEnum.IMPORTANT,
                    is_emergency=False,
                    requires_user_alert=False,
                    interview_grounded=True,
                    classification_type="ANSWERED",
                    confidence_level="HIGH",
                    topic="Work Experience"
                )
            elif "xyz technologies" in resume_lower:
                reply = (
                    "The person I'm representing has hands-on experience as a Software Engineering Intern at XYZ Technologies, "
                    "focusing on backend microservices, REST API design, and PostgreSQL database optimization."
                )
            elif "cognitive dynamics" in resume_lower:
                reply = (
                    "The person I'm representing has extensive experience as a Staff AI Engineer at Cognitive Dynamics, "
                    "and previously as a Senior Backend Engineer at CloudNova Systems."
                )
            else:
                reply = f"According to their resume, they have hands-on software engineering experience specializing in {primary_skills_str}."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Work Experience"
            )

        # 12. RESUME-BASED ANSWERING: Education & College (Rule 1)
        if any(k in text_lower for k in ["education", "degree", "college", "university", "graduate", "study", "cgpa", "gpa"]):
            edu_sec = sections.get("EDUCATION", "").strip()
            if edu_sec:
                edu_clean_lines = [l.strip().lstrip('*•- #').replace('**', '') for l in edu_sec.splitlines() if l.strip() and not l.strip().startswith('---')]
                if len(edu_clean_lines) >= 2:
                    degree_part = edu_clean_lines[0]
                    institution_part = edu_clean_lines[1]
                    extra_part = f", {edu_clean_lines[2]}" if len(edu_clean_lines) > 2 and ("cgpa" in edu_clean_lines[2].lower() or "gpa" in edu_clean_lines[2].lower() or "20" in edu_clean_lines[2]) else ""
                    reply = f"According to their resume, they completed {degree_part} at {institution_part}{extra_part}."
                elif len(edu_clean_lines) == 1:
                    reply = f"According to their resume, their education includes {edu_clean_lines[0]}."
                else:
                    reply = "According to their resume, they hold a Bachelor's degree in Computer Science and Engineering."
            elif "abc institute" in resume_lower or "8.7" in resume_lower:
                reply = (
                    "According to their resume, they completed a Bachelor of Technology in Computer Science and Engineering "
                    "at ABC Institute of Technology in Hyderabad with a CGPA of 8.7 out of 10."
                )
            elif "berkeley" in resume_lower:
                reply = "According to their resume, they graduated with a B.S. in Computer Science from UC Berkeley, Magna Cum Laude."
            else:
                reply = "According to their resume, they hold a Bachelor's degree in Computer Science and Engineering."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                grounding_notes="Grounded on verified education.",
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Education"
            )

        # 13. RESUME-BASED ANSWERING: Certifications (Rule 1)
        if any(k in text_lower for k in ["certification", "certified", "credentials"]):
            cert_sec = sections.get("CERTIFICATIONS", "").strip()
            if cert_sec:
                cert_clean_lines = [l.strip().lstrip('*•- #').replace('**', '') for l in cert_sec.splitlines() if l.strip() and not l.strip().startswith('---')]
                if cert_clean_lines:
                    certs_str = ", ".join(cert_clean_lines[:4])
                    reply = f"According to their resume, they hold certifications including {certs_str}."
                else:
                    reply = "According to their resume, they hold verified professional certifications."
            elif "aws certified" in resume_lower or "nptel" in resume_lower:
                reply = (
                    "They hold certifications including AWS Certified Cloud Practitioner, "
                    "Programming in Java from NPTEL, and Data Structures and Algorithms from Coursera."
                )
            else:
                reply = "According to their resume, they hold professional certifications including AWS Cloud Practitioner."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Certifications"
            )

        # 14. RESUME-BASED ANSWERING: Achievements & Coding (Rule 1)
        if any(k in text_lower for k in ["achievement", "accomplishment", "leetcode", "hackerrank", "coding problem", "rank", "competition"]):
            ach_sec = sections.get("ACHIEVEMENTS", "").strip()
            if ach_sec:
                ach_clean_lines = [l.strip().lstrip('*•- #').replace('**', '') for l in ach_sec.splitlines() if l.strip() and not l.strip().startswith('---')]
                if ach_clean_lines:
                    ach_str = ". ".join(ach_clean_lines[:2])
                    reply = f"Their resume highlights achievements including {ach_str}."
                else:
                    reply = "Their achievements include solving over 350 coding problems across LeetCode, HackerRank, and CodeChef."
            else:
                reply = (
                    "Their achievements include solving over 350 coding problems across LeetCode, HackerRank, and CodeChef, "
                    "and ranking in the top 10% in a university-level coding competition."
                )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.NORMAL,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Achievements"
            )

        # 15. RESUME-BASED ANSWERING: Summary / Candidate Overview / Background
        if any(k in text_lower for k in ["about them", "about him", "about her", "background", "introduce", "walk me through", "overview", "who is", "tell me about yourself", "tell me about them", "resume"]):
            if summary_clean:
                # Keep spoken length concise (under 250 chars)
                first_period = summary_clean.find(".")
                second_period = summary_clean.find(".", first_period + 1) if first_period != -1 else -1
                spoken_summary = summary_clean[:second_period + 1] if second_period != -1 else summary_clean[:220]
                reply = f"The person I'm representing is a {spoken_summary.lstrip('#').strip()}."
            else:
                reply = (
                    f"The person I'm representing is a Computer Science graduate specializing in backend development, "
                    f"REST API design, and cloud technologies. They are proficient in Python, FastAPI, Java, and PostgreSQL, "
                    f"with practical internship experience at XYZ Technologies."
                )
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Candidate Overview"
            )

        # 16. DYNAMIC KEYWORD SEARCH ACROSS RESUME TEXT (Fallback Matcher)
        # If the question contains terms that exist in the resume, find the relevant bullet point
        query_words = [w for w in re.findall(r'\b[a-z]{3,}\b', text_lower) if w not in ["what", "tell", "about", "your", "they", "them", "have", "with", "does", "from", "this", "that", "there", "were", "been"]]
        matching_lines = []
        for r_line in raw_resume.splitlines():
            r_line_clean = r_line.strip()
            if not r_line_clean or r_line_clean.startswith("#"):
                continue
            r_line_low = r_line_clean.lower()
            matches = sum(1 for qw in query_words if qw in r_line_low)
            if matches > 0:
                matching_lines.append((matches, r_line_clean))
        
        if matching_lines:
            matching_lines.sort(key=lambda x: x[0], reverse=True)
            best_fact = matching_lines[0][1].lstrip("*•- #").strip()
            reply = f"According to their resume, {best_fact}."
            return AIResponse(
                reply_text=reply,
                detected_intent=CallCategoryEnum.INTERVIEW,
                detected_urgency=UrgencyLevelEnum.IMPORTANT,
                is_emergency=False,
                requires_user_alert=False,
                interview_grounded=True,
                classification_type="ANSWERED",
                confidence_level="HIGH",
                topic="Resume Grounded Query"
            )

        # 17. UNCERTAIN QUESTIONS (Rule 4)
        # If the question asks about a skill, company, or qualification NOT in the resume:
        # DO NOT GUESS.
        reply = "I’m not completely sure about that as that is not listed on their resume, so I’ll ask the person I’m representing to get back to you."
        return AIResponse(
            reply_text=reply,
            detected_intent=CallCategoryEnum.INTERVIEW,
            detected_urgency=UrgencyLevelEnum.NORMAL,
            is_emergency=False,
            requires_user_alert=False,
            interview_grounded=False,
            grounding_notes="Uncertain / not found in approved resume information.",
            classification_type="UNCERTAIN",
            confidence_level="LOW",
            topic="Uncertain / Unverified Query"
        )


    async def classify_call(
        self,
        transcripts: List[Dict[str, Any]],
        caller_info: Optional[Dict[str, Any]] = None
    ) -> IntentClassification:
        full_text = " ".join([t.get("text", "") for t in transcripts]).lower()

        if bool(re.search(r'\b(hospital|emergency|ambulance|car crash|accident|collision|admitted|icu|police|cardiac)\b', full_text)):
            return IntentClassification(
                primary_category=CallCategoryEnum.EMERGENCY,
                confidence=0.99,
                secondary_categories=[],
                reasoning="Caller communicated an urgent health or safety emergency requiring immediate response.",
                urgency=UrgencyLevelEnum.POTENTIAL_EMERGENCY
            )

        if any(k in full_text for k in ["interview", "skills", "projects", "experience", "education", "resume", "candidate", "internship"]):
            return IntentClassification(
                primary_category=CallCategoryEnum.INTERVIEW,
                confidence=0.98,
                secondary_categories=["BUSINESS"],
                reasoning="Live call inquiry regarding candidate skills, resume qualifications, or interview screening.",
                urgency=UrgencyLevelEnum.IMPORTANT
            )

        if any(k in full_text for k in ["warranty", "auto warranty", "marketing", "promotion", "pre-approved"]):
            return IntentClassification(
                primary_category=CallCategoryEnum.SPAM,
                confidence=0.98,
                secondary_categories=[],
                reasoning="Automated or unsolicited sales telemarketing offer.",
                urgency=UrgencyLevelEnum.NORMAL
            )

        return IntentClassification(
            primary_category=CallCategoryEnum.NORMAL,
            confidence=0.88,
            secondary_categories=[],
            reasoning="General telephone inquiry handled by AI representative.",
            urgency=UrgencyLevelEnum.NORMAL
        )

    async def summarize_call(
        self,
        transcripts: List[Dict[str, Any]],
        call_metadata: Optional[Dict[str, Any]] = None
    ) -> CallSummaryOutput:
        metadata = call_metadata or {}
        caller_name = metadata.get("caller_name", "Caller")
        category = metadata.get("category", "NORMAL")

        questions_asked = []
        questions_answered = []
        questions_private = []
        questions_unrelated = []
        questions_uncertain = []
        follow_ups = []
        key_decisions = []

        # Analyze caller questions and assistant replies
        caller_texts = [t.get("text", "") for t in transcripts if t.get("speaker") == "CALLER"]

        for text in caller_texts:
            t_low = text.lower()
            if len(text.strip()) < 3:
                continue
            questions_asked.append(text)

            # Check if this was classified as private
            if any(k in t_low for k in ["salary", "compensation", "address", "phone", "email", "password", "bank", "family"]):
                questions_private.append(text)
            elif any(k in t_low for k in ["movie", "song", "weather", "investment", "joke", "politics"]):
                questions_unrelated.append(text)
            elif any(k in t_low for k in ["skill", "project", "education", "college", "degree", "intern", "experience", "certification", "achievement", "python", "java", "fastapi", "docker", "sql"]):
                questions_answered.append(text)
            else:
                questions_uncertain.append(text)

        if questions_answered:
            key_decisions.append(f"Successfully answered {len(questions_answered)} questions regarding approved resume qualifications.")
        if questions_private:
            key_decisions.append(f"Protected private data: Withheld sensitive details on {len(questions_private)} inquiries.")
            follow_ups.append(f"Follow up with {caller_name} regarding private details requested.")
        if questions_uncertain:
            follow_ups.append(f"Review {len(questions_uncertain)} questions where information was not present in the resume.")

        overview = (
            f"Live voice conversation with {caller_name}. AURA acted as the AI representative, "
            f"answering questions grounded strictly in the approved resume while safeguarding personal privacy."
        )

        action_items = []
        if questions_private or questions_uncertain or category == CallCategoryEnum.INTERVIEW.value:
            action_items.append({
                "task": f"Review conversation with {caller_name} and provide any requested follow-up",
                "priority": "High" if questions_private else "Medium",
                "assignee": "User"
            })

        return CallSummaryOutput(
            overview=overview,
            key_decisions=key_decisions,
            questions_asked=questions_asked,
            questions_answered=questions_answered,
            questions_private=questions_private,
            questions_unrelated=questions_unrelated,
            questions_uncertain=questions_uncertain,
            follow_ups=follow_ups,
            ai_confidence=0.95,
            action_items=action_items
        )
