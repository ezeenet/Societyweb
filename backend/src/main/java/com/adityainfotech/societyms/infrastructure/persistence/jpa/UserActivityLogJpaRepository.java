package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.UserActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityLogJpaRepository extends JpaRepository<UserActivityLog, Long> {

    Page<UserActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<UserActivityLog> findByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(
        String username, Pageable pageable
    );
}
