package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.UserCreateRequest;
import com.adityainfotech.societyms.application.dto.request.UserUpdateRequest;
import com.adityainfotech.societyms.application.dto.response.ActivityLogResponse;
import com.adityainfotech.societyms.application.dto.response.UserResponse;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserActivityLogJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.DuplicateResourceException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementService {

    private final UserJpaRepository            userRepository;
    private final MemberJpaRepository          memberRepository;
    private final UserActivityLogJpaRepository logRepository;
    private final PasswordEncoder              passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
            .map(u -> {
                String memberName = null;
                if (u.getMemberId() != null) {
                    memberName = memberRepository.findById(u.getMemberId())
                        .map(Member::getFullName).orElse(null);
                }
                return UserResponse.from(u, memberName);
            }).toList();
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException(
                "Username '" + request.username() + "' is already taken");
        }

        User user = User.builder()
            .username(request.username().trim().toLowerCase())
            .password(passwordEncoder.encode(request.password()))
            .role(request.role())
            .fullName(request.fullName())
            .memberId(request.memberId())
            .isActive(true)
            .build();

        User saved = userRepository.save(user);
        log.info("User created: username={}, role={}", saved.getUsername(), saved.getRole());
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("User", id));

        if (request.fullName()  != null) user.setFullName(request.fullName());
        if (request.role()      != null) user.setRole(request.role());
        if (request.memberId()  != null) user.setMemberId(request.memberId());
        if (request.isActive()  != null) user.setIsActive(request.isActive());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("User", id));
        user.setIsActive(!user.getIsActive());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("User", id));

        String currentUsername = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        if (user.getUsername().equals(currentUsername)) {
            throw new BusinessRuleException(
                "Cannot delete your own account.", "SELF_DELETE");
        }

        userRepository.delete(user);
        log.info("User deleted: id={}, username={}", id, user.getUsername());
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getActivityLog(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return logRepository
                .findByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(search, pageable)
                .map(ActivityLogResponse::from);
        }
        return logRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(ActivityLogResponse::from);
    }
}
