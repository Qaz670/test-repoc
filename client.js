using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelCombats2.AdminSystem
{
    [System.Serializable]
    public class AdminData
    {
        public string playerId;
        public string playerName;
        public AdminLevel level;
        public List<string> permissions;
        public DateTime grantDate;
        public string grantedBy;
    }

    public enum AdminLevel
    {
        None = 0,
        Moderator = 1,
        Admin = 2,
        SuperAdmin = 3
    }

    public class AdminManager : MonoBehaviour
    {
        public static AdminManager Instance { get; private set; }
        
        [SerializeField] private List<AdminData> adminList = new List<AdminData>();
        [SerializeField] private AdminData currentAdmin;
        
        // Параметры полета
        [Header("Flight Settings")]
        [SerializeField] private float flightSpeed = 10f;
        [SerializeField] private float flightAcceleration = 20f;
        [SerializeField] private float maxFlightSpeed = 50f;
        
        private bool isFlying = false;
        private CharacterController characterController;
        private Vector3 flightVelocity;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadAdminData();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Update()
        {
            if (isFlying && currentAdmin != null)
            {
                HandleFlight();
            }
        }
        
        public bool IsPlayerAdmin(string playerId)
        {
            return adminList.Exists(admin => admin.playerId == playerId);
        }
        
        public AdminData GetAdminData(string playerId)
        {
            return adminList.Find(admin => admin.playerId == playerId);
        }
        
        public bool HasPermission(string playerId, string permission)
        {
            var admin = GetAdminData(playerId);
            return admin != null && admin.permissions.Contains(permission);
        }
        
        public void AddAdmin(string playerId, string playerName, AdminLevel level, 
                           List<string> permissions, string grantedBy)
        {
            if (IsPlayerAdmin(playerId))
            {
                UpdateAdmin(playerId, level, permissions);
                return;
            }
            
            var newAdmin = new AdminData
            {
                playerId = playerId,
                playerName = playerName,
                level = level,
                permissions = permissions,
                grantDate = DateTime.Now,
                grantedBy = grantedBy
            };
            
            adminList.Add(newAdmin);
            SaveAdminData();
            
            Debug.Log($"Админ добавлен: {playerName} (ID: {playerId})");
            
            // Уведомление в сети
            NetworkManager.Instance?.SendAdminNotification($"{playerName} теперь администратор");
        }
        
        public void RemoveAdmin(string playerId)
        {
            var admin = GetAdminData(playerId);
            if (admin != null)
            {
                adminList.Remove(admin);
                SaveAdminData();
                
                Debug.Log($"Админ удален: {admin.playerName}");
                
                // Если удаляем текущего админа, отключаем его возможности
                if (currentAdmin != null && currentAdmin.playerId == playerId)
                {
                    currentAdmin = null;
                    DisableFlight();
                }
            }
        }
        
        public void UpdateAdmin(string playerId, AdminLevel level, List<string> permissions)
        {
            var admin = GetAdminData(playerId);
            if (admin != null)
            {
                admin.level = level;
                admin.permissions = permissions;
                SaveAdminData();
            }
        }
        
        public void SetCurrentAdmin(string playerId)
        {
            currentAdmin = GetAdminData(playerId);
            
            if (currentAdmin != null)
            {
                Debug.Log($"Текущий админ: {currentAdmin.playerName}");
                
                // Инициализация компонентов для админ-способностей
                InitializeAdminAbilities();
            }
        }
        
        private void InitializeAdminAbilities()
        {
            characterController = GetComponent<CharacterController>();
            
            if (characterController == null && currentAdmin != null)
            {
                var playerObject = GameObject.FindGameObjectWithTag("Player");
                if (playerObject != null)
                {
                    characterController = playerObject.GetComponent<CharacterController>();
                }
            }
        }
        
        // Система полета
        public void ToggleFlight()
        {
            if (currentAdmin == null || !HasPermission(currentAdmin.playerId, "flight"))
            {
                Debug.Log("Нет прав на полет");
                return;
            }
            
            isFlying = !isFlying;
            
            if (isFlying)
            {
                EnableFlight();
            }
            else
            {
                DisableFlight();
            }
        }
        
        private void EnableFlight()
        {
            if (characterController != null)
            {
                characterController.enabled = false;
                flightVelocity = Vector3.zero;
            }
            
            Debug.Log("Полет активирован");
        }
        
        private void DisableFlight()
        {
            if (characterController != null)
            {
                characterController.enabled = true;
            }
            
            Debug.Log("Полет деактивирован");
        }
        
        private void HandleFlight()
        {
            if (characterController == null) return;
            
            // Получаем ввод
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");
            float upDown = 0f;
            
            if (Input.GetKey(KeyCode.Space)) upDown = 1f;
            if (Input.GetKey(KeyCode.LeftControl)) upDown = -1f;
            
            Vector3 inputDirection = new Vector3(horizontal, upDown, vertical).normalized;
            
            // Преобразуем ввод в мировые координаты
            Vector3 moveDirection = transform.forward * inputDirection.z + 
                                   transform.right * inputDirection.x + 
                                   transform.up * inputDirection.y;
            
            // Ускорение
            flightVelocity = Vector3.MoveTowards(flightVelocity, 
                moveDirection * maxFlightSpeed, 
                flightAcceleration * Time.deltaTime);
            
            // Перемещение
            transform.position += flightVelocity * Time.deltaTime;
            
            // Поворот камеры (если нужно)
            if (Input.GetMouseButton(1)) // Правая кнопка мыши
            {
                float mouseX = Input.GetAxis("Mouse X") * 2f;
                float mouseY = Input.GetAxis("Mouse Y") * 2f;
                
                transform.Rotate(Vector3.up * mouseX);
                Camera.main.transform.Rotate(Vector3.left * mouseY);
            }
        }
        
        // Сохранение и загрузка данных
        private void SaveAdminData()
        {
            string jsonData = JsonUtility.ToJson(new AdminListWrapper { admins = adminList });
            PlayerPrefs.SetString("AdminData", jsonData);
            PlayerPrefs.Save();
        }
        
        private void LoadAdminData()
        {
            if (PlayerPrefs.HasKey("AdminData"))
            {
                string jsonData = PlayerPrefs.GetString("AdminData");
                var wrapper = JsonUtility.FromJson<AdminListWrapper>(jsonData);
                adminList = wrapper.admins;
            }
        }
        
        [System.Serializable]
        private class AdminListWrapper
        {
            public List<AdminData> admins;
        }
    }
            }
