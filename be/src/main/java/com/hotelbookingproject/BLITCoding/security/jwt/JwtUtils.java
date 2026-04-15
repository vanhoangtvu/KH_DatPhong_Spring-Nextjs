package com.hotelbookingproject.BLITCoding.security.jwt;

import com.hotelbookingproject.BLITCoding.security.user.HotelUserDetails;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;



@Configuration("jwtConfigProps")
@ConfigurationProperties(prefix = "jwt")
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

   // @Value("${security.jwt.secrete}")
    private String secret;
    //@Value("${security.jwt.expirationTime}")
    private Long expiration;


    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
    public Long getExpiration() {
        return expiration;
    }
    public void setExpiration(Long expiration) {
        this.expiration = expiration;
    }

    public String getJwtTokenForUser(Authentication authentication) {
        HotelUserDetails userPrincipal = (HotelUserDetails) authentication.getPrincipal();
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).toList();
        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("roles",roles)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + expiration))
                .signWith(key(), SignatureAlgorithm.HS256).compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String getUserNameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();

    }

    public boolean validateToken(String token) {
        try{
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
            return true;
        }catch (MalformedJwtException e){
            logger.error("Invalid JWT token : {}", e.getMessage());
        }catch (ExpiredJwtException e){
            logger.warn("Expired JWT token : {}", e.getMessage());
        }catch (UnsupportedJwtException e){
            logger.error("Unsupported JWT token : {}", e.getMessage());
        }catch (IllegalArgumentException e){
            logger.error("JWT token could not be parsed");
        }
        return false;
    }

    public List<String> getRolesFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
            Object rolesClaim = claims.get("roles");
            if (rolesClaim instanceof List<?> rolesList) {
                return rolesList.stream().map(String::valueOf).toList();
            }
        } catch (Exception e) {
            logger.warn("Cannot read roles from JWT token: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public boolean hasRole(String token, String requiredRole) {
        if (token == null || token.isBlank() || requiredRole == null || requiredRole.isBlank()) {
            return false;
        }

        String normalizedRole = requiredRole.trim().toUpperCase(Locale.ROOT);
        if (!normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole;
        }

        String finalNormalizedRole = normalizedRole;
        return getRolesFromToken(token).stream()
                .map(role -> role == null ? "" : role.trim().toUpperCase(Locale.ROOT))
                .anyMatch(role -> role.equals(finalNormalizedRole));
    }


}
