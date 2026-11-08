package com.example.cookielab;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cookies")
public class CookieController {
    private final boolean secure;
    private final String sameSite;

    public CookieController(
            @Value("${app.cookie.secure}") boolean secure,
            @Value("${app.cookie.same-site}") String sameSite) {
        this.secure = secure;
        this.sameSite = sameSite;
    }

    @PostMapping("/set")
    public ResponseEntity<CookieActionResponse> setCookies() {
        ResponseCookie visible = cookie("demoVisible", "hello-from-browser-cookie", false).build();
        ResponseCookie httpOnly = cookie("demoHttpOnly", "server-only-demo-value", true).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, visible.toString())
                .header(HttpHeaders.SET_COOKIE, httpOnly.toString())
                .body(new CookieActionResponse("Установлены demoVisible и demoHttpOnly."));
    }

    @GetMapping("/inspect")
    public CookieInspectionResponse inspect(HttpServletRequest request) {
        Map<String, String> received = request.getCookies() == null
                ? Map.of()
                : Arrays.stream(request.getCookies())
                        .collect(java.util.stream.Collectors.toMap(
                                jakarta.servlet.http.Cookie::getName,
                                jakarta.servlet.http.Cookie::getValue,
                                (first, ignored) -> first));

        List<ReceivedCookie> cookies = received.entrySet().stream()
                .map(entry -> new ReceivedCookie(
                        entry.getKey(), entry.getValue(), "demoHttpOnly".equals(entry.getKey())))
                .sorted(Comparator.comparing(ReceivedCookie::name))
                .toList();

        return new CookieInspectionResponse(
                cookies,
                "Учебный endpoint: не возвращайте значения настоящих секретных cookie из API.");
    }

    @PostMapping("/clear")
    public ResponseEntity<CookieActionResponse> clearCookies() {
        ResponseCookie visible = cookie("demoVisible", "", false).maxAge(0).build();
        ResponseCookie httpOnly = cookie("demoHttpOnly", "", true).maxAge(0).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, visible.toString())
                .header(HttpHeaders.SET_COOKIE, httpOnly.toString())
                .body(new CookieActionResponse("Обе demo-cookie удалены."));
    }

    private ResponseCookie.ResponseCookieBuilder cookie(String name, String value, boolean httpOnly) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secure)
                .path("/")
                .sameSite(sameSite)
                .maxAge(3600);
    }

    public record CookieActionResponse(String message) {}

    public record CookieInspectionResponse(List<ReceivedCookie> receivedCookies, String note) {}

    public record ReceivedCookie(String name, String value, boolean httpOnly) {}
}
