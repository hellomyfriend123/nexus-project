package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.security.SocialLoginResult;
import com.nexus.common.security.TokenService;
import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.repository.UserRoleRepository;
import com.nexus.user.service.RoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử {@link SocialAuthServiceImpl} — ánh xạ danh tính Google sang tài khoản Nexus.
 * <p>
 * Trọng tâm là các quy tắc an toàn, vì đây là code cấp quyền truy cập:
 * <ul>
 *   <li>Email chưa xác thực → từ chối (nếu không, kẻ tấn công chiếm được tài khoản người khác).</li>
 *   <li>Tài khoản bị khoá → từ chối.</li>
 *   <li>Tài khoản đã tồn tại → <b>không</b> đổi vai trò trong DB.</li>
 *   <li>Tài khoản mới → luôn có mật khẩu băm, không bao giờ để trống.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class SocialAuthServiceImplTest {

    private static final String EMAIL = "nguoidung@gmail.com";
    private static final String SUBJECT = "109876543210987654321";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private RoleService roleService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private SocialAuthServiceImpl service;

    private static User user(UserStatus status) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(EMAIL)
                .username("nguoidung")
                .passwordHash("$2a$10$hash")
                .fullName("Người Dùng")
                .status(status)
                .build();
    }

    private void stubToken() {
        when(tokenService.generate(any(), anyString(), any())).thenReturn("token-noi-bo");
        when(tokenService.ttlSeconds()).thenReturn(3600L);
    }

    @Test
    @DisplayName("Email chưa xác thực → từ chối, không đụng DB")
    void emailChuaXacThuc_biTuChoi() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", false, "BUYER"));

        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        verifyNoInteractions(userRepository, userRoleRepository, roleService);
    }

    @Test
    @DisplayName("Không có email → BAD_REQUEST")
    void khongCoEmail_biTuChoi() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.authenticate("google", SUBJECT, null, "Người Dùng", true, "BUYER"));

        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Tài khoản có sẵn và ACTIVE → cấp token, giữ nguyên vai trò trong DB")
    void taiKhoanCoSan_capToken() {
        User existing = user(UserStatus.ACTIVE);
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.of(existing));
        when(roleService.findRoleCodesOfUser(existing.getId())).thenReturn(List.of("SELLER"));
        stubToken();

        SocialLoginResult result = service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "BUYER");

        assertEquals("token-noi-bo", result.accessToken());
        assertEquals(List.of("SELLER"), result.roles(), "Không được đổi vai trò của tài khoản đã có");
        assertFalse(result.newUser());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Tài khoản BANNED → FORBIDDEN, không cấp token")
    void taiKhoanBiKhoa_biTuChoi() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL))
                .thenReturn(Optional.of(user(UserStatus.BANNED)));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "BUYER"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verifyNoInteractions(tokenService);
    }

    @Test
    @DisplayName("Tài khoản INACTIVE → FORBIDDEN")
    void taiKhoanVoHieuHoa_biTuChoi() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL))
                .thenReturn(Optional.of(user(UserStatus.INACTIVE)));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "BUYER"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Email mới → tạo user + gán vai trò + cấp token, mật khẩu luôn được băm")
    void emailMoi_taoTaiKhoan() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByUsernameAndDeletedAtIsNull("nguoidung")).thenReturn(false);

        Role buyer = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_BUYER).build();
        when(roleService.getByCode(RoleService.ROLE_BUYER)).thenReturn(buyer);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());  // giả lập DB sinh khoá
            return u;
        });
        stubToken();

        SocialLoginResult result = service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "BUYER");

        assertTrue(result.newUser());
        assertEquals(EMAIL, result.email());
        assertEquals(List.of(RoleService.ROLE_BUYER), result.roles());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals(EMAIL, saved.getEmail());
        assertNotNull(saved.getPasswordHash(), "password_hash là NOT NULL — phải có giá trị");
        assertEquals(UserStatus.ACTIVE, saved.getStatus());

        verify(userRoleRepository).save(any(UserRole.class));
    }

    @Test
    @DisplayName("Email mới nhưng username đã tồn tại → thêm hậu tố số")
    void usernameTrung_themHauTo() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByUsernameAndDeletedAtIsNull("nguoidung")).thenReturn(true);
        when(userRepository.existsByUsernameAndDeletedAtIsNull("nguoidung2")).thenReturn(false);

        Role buyer = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_BUYER).build();
        when(roleService.getByCode(RoleService.ROLE_BUYER)).thenReturn(buyer);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        stubToken();

        service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "BUYER");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("nguoidung2", captor.getValue().getUsername());
    }

    @Test
    @DisplayName("Vai trò lạ từ client → rơi về BUYER, không bao giờ tạo ADMIN")
    void vaiTroLa_roiVeBuyer() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByUsernameAndDeletedAtIsNull(anyString())).thenReturn(false);

        Role buyer = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_BUYER).build();
        when(roleService.getByCode(eq(RoleService.ROLE_BUYER))).thenReturn(buyer);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        stubToken();

        SocialLoginResult result = service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "ADMIN");

        assertEquals(List.of(RoleService.ROLE_BUYER), result.roles(),
                "Client không được tự nâng quyền qua tham số ?role=");
        verify(roleService, never()).getByCode(RoleService.ROLE_ADMIN);
    }

    @Test
    @DisplayName("SELLER được tôn trọng khi tạo tài khoản mới")
    void vaiTroSeller_duocTonTrong() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByUsernameAndDeletedAtIsNull(anyString())).thenReturn(false);

        Role seller = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_SELLER).build();
        when(roleService.getByCode(RoleService.ROLE_SELLER)).thenReturn(seller);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        stubToken();

        SocialLoginResult result = service.authenticate("google", SUBJECT, EMAIL, "Người Dùng", true, "seller");

        assertEquals(List.of(RoleService.ROLE_SELLER), result.roles());
    }

    @Test
    @DisplayName("Google không trả name → lấy phần trước @ của email làm tên")
    void thieuTen_layTuEmail() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByUsernameAndDeletedAtIsNull(anyString())).thenReturn(false);

        Role buyer = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_BUYER).build();
        when(roleService.getByCode(RoleService.ROLE_BUYER)).thenReturn(buyer);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        stubToken();

        service.authenticate("google", SUBJECT, EMAIL, null, true, "BUYER");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("nguoidung", captor.getValue().getFullName());
    }

    @Test
    @DisplayName("Email được chuẩn hoá về chữ thường trước khi tra cứu")
    void emailDuocChuanHoa() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL))
                .thenReturn(Optional.of(user(UserStatus.ACTIVE)));
        when(roleService.findRoleCodesOfUser(any())).thenReturn(List.of("BUYER"));
        stubToken();

        service.authenticate("google", SUBJECT, "  NguoiDung@Gmail.COM  ", "Người Dùng", true, "BUYER");

        verify(userRepository).findByEmailAndDeletedAtIsNull(EMAIL);
    }
}
